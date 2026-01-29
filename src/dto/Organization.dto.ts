export interface IOrganization {
  OrganizationId?: string;
  Name?: string;
  Address?: string;
  Location?: string;
  PhoneNumber?: string;
  Email?: string;
  Website?: string;
  CompanyLogo?: string;
  InvoiceTerms?: string;
  InvoiceNotes?: string;
  Currency?: string;
}

export class OrganizationDto implements IOrganization {
  constructor(
    public OrganizationId?: string,
    public Name?: string,
    public Address?: string,
    public Location?: string,
    public PhoneNumber?: string,
    public Email?: string,
    public Website?: string,
    public CompanyLogo?: string,
    public InvoiceTerms?: string,
    public InvoiceNotes?: string,
    public Currency?: string
  ) {}
}
