import {
    RoleConfig,
    RolePermissions,
} from '../app/access-control/roleConfig';

export interface IPermission {
    Key?: string;
    Name?: string;
}

export class PermissionDto implements IPermission {
    constructor(public Key?: string, public Name?: string) {}
}

export interface IPermissionCategory {
    ServiceName?: string;
    ServiceId?: string;
    Permissions?: IPermission[];
}

export class PermissionCategoryDto implements IPermissionCategory {
    constructor(
        public ServiceName?: string,
        public ServiceId?: string,
        public Permissions?: IPermission[]
    ) {}
}


export interface IRole {
    RoleId?: string;
Name?: string;
Description?: string;
PermissionCategories?: IPermissionCategory[];

}

export class RoleDto implements IRole {
    constructor(
        public RoleId?: string,
public Name?: string,
public Description?: string,
public PermissionCategories?: IPermissionCategory[],

    ) {
    }
}


const permissionsMap: { [key: string]: string } = {
    A: 'CREATE',
    U: 'UPDATE',
    R: 'READ',
    D: 'DELETE',
};

export function transformRolesToRoleConfig(roles: RoleDto[]): RoleConfig {
    const roleConfig: RoleConfig = {};

    roles.forEach((role) => {
        const rolePermissions: RolePermissions = {};

        role.PermissionCategories?.forEach((category) => {
            if (category.Permissions?.length! > 0) {
                rolePermissions[category.ServiceId || ''] =
                    category.Permissions?.map(
                        (permission) => permissionsMap[permission.Key!]
                    ) || undefined;
            }
        });

        roleConfig[role.Name!] = rolePermissions;
    });

    return roleConfig;
}
