// generated from https://github.com/prusa3d/Prusa-Link-Web/blob/377e1509542100efe1689415d603d7a330d28d3c/spec/openapi.yaml

export class StatusPrinterStatusPrinter {
  "ok"?: boolean;
  "message"?: string;
}

export interface StatusPrinter {
  state: StatusPrinterStateEnum;
  temp_nozzle?: number;
  target_nozzle?: number;
  temp_bed?: number;
  target_bed?: number;
  // Available only when printer is not moving
  axis_x?: number;
  // Available only when printer is not moving
  axis_y?: number;
  axis_z?: number;
  flow?: number;
  speed?: number;
  fan_hotend?: number;
  fan_print?: number;
  status_printer?: StatusPrinterStatusPrinter;
  status_connect?: StatusPrinterStatusPrinter;
}

export enum StatusPrinterStateEnum {
  Idle = "IDLE",
  Busy = "BUSY",
  Printing = "PRINTING",
  Paused = "PAUSED",
  Finished = "FINISHED",
  Stopped = "STOPPED",
  Error = "ERROR",
  Atttention = "ATTTENTION", // sic
  Ready = "READY",
}

export interface Info {
  mmu?: boolean;
  name?: string;
  location?: string;
  farm_mode?: boolean;
  nozzle_diameter?: number;
  min_extrusion_temp?: number;
  serial?: string;
  sd_ready?: boolean;
  active_camera?: boolean;
  hostname?: string;
  port?: string;
  network_error_chime?: boolean;
}
