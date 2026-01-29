export const environment = {
  production: false,
  serverUrl: 'https://imo-user-mgt.onrender.com/User-Mgt/api',
  SupplierUrl: 'https://imo-mgt-be.onrender.com/Suppliers/api',
  ReportUrl: 'http://127.0.0.1:8886/Reports/api',
   OrganizeUrl: 'http://127.0.0.1:8888/Organizations/api',
 InventoryUrl: 'http://127.0.0.1:8882/Inventory/api',
 
  LogoLight: '#',
  LogoDark: '#',
  WORKSPACEID: 'WS680',
  auth0: {
    domain: 'dev-yi2vtudtt52q3bgx.us.auth0.com',
    clientId: '56bSrJyNAAcsE7Hfs88lBH3BEXYesuwA',
    authorizationParams: {
      // audience: 'https://h-pos.us.auth0.com/api/v2/',
      redirect_uri: 'https://imo-mgt-fe.onrender.com',
    },
  },
};
