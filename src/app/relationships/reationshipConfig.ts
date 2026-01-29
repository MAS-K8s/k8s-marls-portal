type RelationshipConfig = {
    [dtoId: string]: string[];
};

export type dtoIdNameConfig = {
    name : string;
    id : string;
    icon: string;
    label: string;
}
const dtoIds: dtoIdNameConfig[] = [
    { name: "User", id: "DTO5212", icon: "pi-users", label: "Users" },
{ name: "Role", id: "DTO5214", icon: "pi-key", label: "Role" },
{ name: "Merchants", id: "DTO5222", icon: "pi-users", label: "Merchants" },
{ name: "Resellers", id: "DTO5230", icon: "pi-truck", label: "Resellers" },
{ name: "Customers", id: "DTO5223", icon: "pi-file-o", label: "Customer" },
{ name: "Customer-Orders", id: "DTO5224", icon: "pi-shopping-cart", label: "Customer Orders" },
{ name: "ProductSubCategory", id: "DTO5225", icon: "pi-sitemap", label: "Product Sub Category" },
{ name: "Product", id: "DTO5226", icon: "pi-shopping-cart", label: "Product" },
{ name: "InternalMove", id: "DTO5227", icon: "pi-exchange", label: "Internal Move" },
{ name: "GRN", id: "DTO5228", icon: "pi-file-o", label: "GRN" },
{ name: "InventoryHistory", id: "DTO5229", icon: "pi-history", label: "Inventory History" },
{ name: "ReturnNote", id: "DTO5231", icon: "pi-file-o", label: "Return Note" },
{ name: "Stock", id: "DTO5231", icon: "pi-briefcase", label: "Stock" },
{ name: "Report", id: "DTO5210", icon: "pi-file-o", label: "Report" },
{ name: "Organization", id: "DTO5232", icon: "pi-domain-org", label: "Organization" },
{ name: "stockadjustment", id: "DTO5241", icon: "pi pi-sliders-h", label: "stockadjustment" },
{
  name: 'CompanyInformation',
  id: 'DTO5164',
  icon: 'pi-building-sign',
  label: 'Company Information',
},

];

export const relationshipConfig: RelationshipConfig = {
    DTO5222:["DTO5230"],
			DTO5230:["DTO5223"],
      DTO5223:["DTO5224"],

			
};

export const getDtoNameById = (id: string): string | undefined => {
  const dto = dtoIds.find((dto) => dto.id === id);
  return dto ? dto.name : undefined;
}

export const getDtoLabelAndIconById = (id: string): { label?: string, icon?: string } | undefined => {
  const dto = dtoIds.find((dto) => dto.id === id);
  return dto ? { label: dto.label, icon: dto.icon } : undefined;
}

export const getRelationshipListByDtoId = (dtoId: string): dtoIdNameConfig[] | undefined => {
  const relatedDtoIds = relationshipConfig[dtoId];

  if (relatedDtoIds === undefined) {
    return undefined;
  }
  const relatedDtoObjects = relatedDtoIds.map((id) => {
    const dto = dtoIds.find((dto) => dto.id === id);
    return dto 
      ? dto 
      : { name: id, id, icon: "pi pi-question", label: "Unknown" }; 
  });

  return relatedDtoObjects;
};


