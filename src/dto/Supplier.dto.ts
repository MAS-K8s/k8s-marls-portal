export interface ISupplier {
    SupplierId?: string;
Name?: string;
ContactNumber?: string;
Email?: string;
Address?: string;
Products?: string;
OrgnizationId?: string;
ContactPerson?: string;
Company?: string;
Category?: string;
    Image ?: string;

}

export class SupplierDto implements ISupplier {
    constructor(
        public SupplierId?: string,
public Name?: string,
public ContactNumber?: string,
public Email?: string,
public Address?: string,
public Products?: string,
public OrgnizationId?: string,
public ContactPerson?: string,
public Company?: string,
public Category?: string,
    public Image ?: string,

    ) {
    }
}
