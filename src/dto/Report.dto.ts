export interface IReport {
  ReportId?: string;
  Title?: string;
  Description?: string;
  Author?: string;
}


export class ReportDto implements IReport {
  constructor(
    public ReportId?: string,
    public Title?: string,
    public Description?: string,
    public Author?: string
  ) {}
}
