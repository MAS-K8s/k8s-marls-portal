export const environment = {
  production: false,
  serverUrl: ' https://user-mgt-service.dev-sachin.co.uk/User-Mgt/api',
  SupplierUrl: 'https://imo-mgt-be.onrender.com/Suppliers/api',
  ReportUrl: 'http://127.0.0.1:8886/Reports/api',
  OrganizeUrl: 'http://127.0.0.1:8888/Organizations/api',
 InventoryUrl: 'http://127.0.0.1:8882/Inventory/api',
 
  LogoLight: '#',
  LogoDark: '#',
  WORKSPACEID: 'WS680',
  auth0: {
    domain: 'sachinayeshmantha.uk.auth0.com',
    clientId: 'IB1nY6MzrvgFovpz3aw0rCVZDRpnqVS1',
    authorizationParams: {
      // audience: 'https://h-pos.us.auth0.com/api/v2/',
      redirect_uri: 'https://k8s-marls-portal.dev-sachin.co.uk',
    },
  },
};
