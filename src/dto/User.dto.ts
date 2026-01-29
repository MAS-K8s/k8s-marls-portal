export interface IUser {
  UserId?: string;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  RoleId?: string;
  RoleName?: string;
}

export class UserDto implements IUser {
  constructor(
    public UserId?: string,
    public FirstName?: string,
    public LastName?: string,
    public Email?: string,
    public RoleId?: string,
    public RoleName?: string
  ) {}
}
