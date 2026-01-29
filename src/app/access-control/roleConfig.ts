import { PermissionCategoryDto } from '../../dto/Role.dto';
export type RolePermissions = {
    [dtoId: string]: string[] | undefined;
};

export type RoleConfig = {
    [roleName: string]: RolePermissions;
};

export const roleConfig: RoleConfig = {
};
export const PermissionCategories: PermissionCategoryDto[] = [
    
    {
        ServiceName: 'User',
        ServiceId: 'DTO5212',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
   
    {
        ServiceName: 'Role',
        ServiceId: 'DTO5214',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
   
    {
        ServiceName: 'Merchant',
        ServiceId: 'DTO5222',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },

    {
        ServiceName: 'Reseller',
        ServiceId: 'DTO5230',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
   
    {
        ServiceName: 'Customer',
        ServiceId: 'DTO5223',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },

   
    {
        ServiceName: 'Customer Orders',
        ServiceId: 'DTO5224',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
   
    {
        ServiceName: 'Reseller Orders',
        ServiceId: 'DTO5225',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
   
    {
        ServiceName: 'Merchant Orders',
        ServiceId: 'DTO5226',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
   
    {
        ServiceName: 'Order To Merchant',
        ServiceId: 'DTO5227',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
   
    {
        ServiceName: 'Order To Admin',
        ServiceId: 'DTO5228',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
   
    {
        ServiceName: 'Organization',
        ServiceId: 'DTO5232',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
    {
        ServiceName: 'Report',
        ServiceId: 'DTO5210',
        Permissions: [
            { Name: 'Add', Key: 'A' },
            { Name: 'Update', Key: 'U' },
            { Name: 'Read', Key: 'R' },
            { Name: 'Delete', Key: 'D' },
        ],
    },
];