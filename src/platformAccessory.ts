import { Service, PlatformAccessory } from "homebridge";

import { AccessoryContext, PrusalinkHomebridgePlatform } from "./platform";
import { Info, StatusPrinter } from "./api";

export class PrusalinkPlatformAccessory {
  private tempService: Service;

  constructor(
    private readonly platform: PrusalinkHomebridgePlatform,
    private readonly accessory: PlatformAccessory<AccessoryContext>,
  ) {
    // set accessory information
    const accessoryCharacteristics = this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        "Prusa Research",
      )
      .setCharacteristic(this.platform.Characteristic.Model, "Prusa MK4");
    const serialNumber = (accessory.context.info as Info).serial;
    if (serialNumber) {
      accessoryCharacteristics.setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        serialNumber,
      );
    }

    // you can create multiple services for each accessory
    this.tempService =
      this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.tempService.setCharacteristic(
      this.platform.Characteristic.Name,
      "Temperature Sensor",
    );
    // this.nozzleTempService.getCharacteristic(this.platform.Characteristic.StatusActive, false);
    this.tempService
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(async () => {
        try {
          this.platform.log.debug("Fetching status");

          let response: Response;
          try {
            response = await fetch(
              new URL(
                "/api/v1/status",
                `http://${this.accessory.context.config.ip}`,
              ).toString(),
              {
                headers: {
                  "X-Api-Key": this.accessory.context.config.password,
                },
              },
            );
          } catch (error) {
            this.platform.log.debug("failed to fetch status");
            throw new this.platform.api.hap.HapStatusError(
              this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
            );
          }

          if (!response.ok) {
            throw new this.platform.api.hap.HapStatusError(
              this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
            );
          }

          if (response.status === 401) {
            throw new this.platform.api.hap.HapStatusError(
              this.platform.api.hap.HAPStatus.INSUFFICIENT_AUTHORIZATION,
            );
          }

          if (response.status !== 200) {
            throw new this.platform.api.hap.HapStatusError(
              this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
            );
          }

          const status = (await response.json()) as { printer: StatusPrinter };

          if (!status.printer.temp_nozzle || !status.printer.temp_bed) {
            throw new this.platform.api.hap.HapStatusError(
              this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
            );
          }

          const active =
            // inactive if attempting to reach a specific temp (preheating or actively printing)
            !(status.printer.target_bed || status.printer.target_nozzle) &&
            // inactive if "cooling down" (temps are way different than each other)
            Math.abs(status.printer.temp_nozzle - status.printer.temp_bed) <
              this.accessory.context.config.maxDelta;
          // possible improvement - track state and force inactive for some fixed time after active
          this.tempService
            .getCharacteristic(this.platform.Characteristic.StatusActive)
            .setValue(active);
          this.tempService
            .getCharacteristic(this.platform.Characteristic.StatusTampered)
            .setValue(
              active
                ? this.platform.Characteristic.StatusTampered.NOT_TAMPERED
                : this.platform.Characteristic.StatusTampered.TAMPERED,
            );
          if (!active) {
            throw new this.platform.api.hap.HapStatusError(
              this.platform.api.hap.HAPStatus.RESOURCE_BUSY,
            );
          }

          // use average temp as the actual value, it's kind of annoying to deal with two sensors
          return (status.printer.temp_nozzle + status.printer.temp_bed) / 2;
        } catch (error) {
          this.tempService
            .getCharacteristic(this.platform.Characteristic.StatusActive)
            .setValue(false);
          throw error;
        }
      });
  }
}
