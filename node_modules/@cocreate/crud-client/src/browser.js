import CoCreateSocket from "@cocreate/socket-client"
import CoCreateCRUD from './crud'

let crud_socket = new CoCreateSocket('ws');

CoCreateCRUD.setSocket(crud_socket);
CoCreateCRUD.createSocket(window.config.host ? window.config.host : window.location.hostname, window.config.organization_Id)

export default CoCreateCRUD;