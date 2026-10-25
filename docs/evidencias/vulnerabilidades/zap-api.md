# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 1 |
| Informational | 2 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Medium | Exceeded High | http://api:3000 | Percentage of responses with status code 4xx | 96 % |
| Info | Informational | http://api:3000 | Percentage of responses with status code 2xx | 3 % |
| Info | Informational | http://api:3000 | Percentage of endpoints with content type application/json | 98 % |
| Info | Informational | http://api:3000 | Percentage of endpoints with content type text/html | 1 % |
| Info | Informational | http://api:3000 | Percentage of endpoints with method DELETE | 7 % |
| Info | Informational | http://api:3000 | Percentage of endpoints with method GET | 56 % |
| Info | Informational | http://api:3000 | Percentage of endpoints with method PATCH | 5 % |
| Info | Informational | http://api:3000 | Percentage of endpoints with method POST | 30 % |
| Info | Informational | http://api:3000 | Count of total endpoints | 154    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Unexpected Content-Type was returned | Low | 2 |
| A Client Error response code was returned by the server | Informational | 152 |
| Non-Storable Content | Informational | Systemic |




## Alert Detail



### [ Unexpected Content-Type was returned ](https://www.zaproxy.org/docs/alerts/100001/)



##### Low (High)

### Description

A Content-Type of text/html was returned by the server.
This is not one of the types expected to be returned by an API.
Raised by the 'Alert on Unexpected Content Types' script

* URL: http://api:3000/api/docs
  * Node Name: `http://api:3000/api/docs`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://api:3000/api/docs/
  * Node Name: `http://api:3000/api/docs/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``


Instances: 2

### Solution



### Reference




#### Source ID: 4

### [ A Client Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Informational (High)

### Description

A response code of 401 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://api:3000/api/v1/customers/id
  * Node Name: `http://api:3000/api/v1/customers/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/id/
  * Node Name: `http://api:3000/api/v1/customers/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/parts/itemId
  * Node Name: `http://api:3000/api/v1/orders/id/parts/itemId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/parts/itemId/
  * Node Name: `http://api:3000/api/v1/orders/id/parts/itemId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/itemId
  * Node Name: `http://api:3000/api/v1/orders/id/services/itemId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/itemId/
  * Node Name: `http://api:3000/api/v1/orders/id/services/itemId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id
  * Node Name: `http://api:3000/api/v1/parts/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/
  * Node Name: `http://api:3000/api/v1/parts/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/services/id
  * Node Name: `http://api:3000/api/v1/services/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/services/id/
  * Node Name: `http://api:3000/api/v1/services/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles/id
  * Node Name: `http://api:3000/api/v1/vehicles/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles/id/
  * Node Name: `http://api:3000/api/v1/vehicles/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000
  * Node Name: `http://api:3000`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/
  * Node Name: `http://api:3000/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/8599607535738638102
  * Node Name: `http://api:3000/8599607535738638102`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api
  * Node Name: `http://api:3000/api`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/
  * Node Name: `http://api:3000/api/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/7536795147430714056
  * Node Name: `http://api:3000/api/7536795147430714056`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/docs/7367042665915533389
  * Node Name: `http://api:3000/api/docs/7367042665915533389`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/docs/json/
  * Node Name: `http://api:3000/api/docs/json/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1
  * Node Name: `http://api:3000/api/v1`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/
  * Node Name: `http://api:3000/api/v1/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/3342371727553810189
  * Node Name: `http://api:3000/api/v1/3342371727553810189`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth
  * Node Name: `http://api:3000/api/v1/auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/
  * Node Name: `http://api:3000/api/v1/auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/564314190282422146
  * Node Name: `http://api:3000/api/v1/auth/564314190282422146`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/actuator/health
  * Node Name: `http://api:3000/api/v1/auth/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/me/
  * Node Name: `http://api:3000/api/v1/auth/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers%3Flimite=limite&deslocamento=deslocamento&documento=documento&nome=nome&ativo=
  * Node Name: `http://api:3000/api/v1/customers (ativo,deslocamento,documento,limite,nome)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/
  * Node Name: `http://api:3000/api/v1/customers/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/1453707596028768021
  * Node Name: `http://api:3000/api/v1/customers/1453707596028768021`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/id
  * Node Name: `http://api:3000/api/v1/customers/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/id/
  * Node Name: `http://api:3000/api/v1/customers/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/id/2521497393017842039
  * Node Name: `http://api:3000/api/v1/customers/id/2521497393017842039`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/health/
  * Node Name: `http://api:3000/api/v1/health/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/me
  * Node Name: `http://api:3000/api/v1/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/me/
  * Node Name: `http://api:3000/api/v1/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/me/5901839243752117248
  * Node Name: `http://api:3000/api/v1/me/5901839243752117248`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/me/orders
  * Node Name: `http://api:3000/api/v1/me/orders`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://api:3000/api/v1/me/orders%3Flimite=limite&deslocamento=deslocamento
  * Node Name: `http://api:3000/api/v1/me/orders (deslocamento,limite)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/me/orders/
  * Node Name: `http://api:3000/api/v1/me/orders/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/me/orders/1958221193163886096
  * Node Name: `http://api:3000/api/v1/me/orders/1958221193163886096`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/me/orders/id
  * Node Name: `http://api:3000/api/v1/me/orders/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/me/orders/id/
  * Node Name: `http://api:3000/api/v1/me/orders/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/metrics
  * Node Name: `http://api:3000/api/v1/metrics`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/metrics/
  * Node Name: `http://api:3000/api/v1/metrics/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/metrics/5351743529258804087
  * Node Name: `http://api:3000/api/v1/metrics/5351743529258804087`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/metrics/execution-time%3F=&ate=2026-11-01T00%253A00%253A00-03%253A00
  * Node Name: `http://api:3000/api/v1/metrics/execution-time (ate)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/metrics/execution-time%3Fde=http%253A%252F%252Fwww.google.com%252F&ate=2026-11-01T00%253A00%253A00-03%253A00
  * Node Name: `http://api:3000/api/v1/metrics/execution-time (ate,de)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/metrics/execution-time%3Fde=2026-10-01T00%253A00%253A00-03%253A00&=
  * Node Name: `http://api:3000/api/v1/metrics/execution-time (de)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/metrics/execution-time/
  * Node Name: `http://api:3000/api/v1/metrics/execution-time/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders%3Flimite=limite&deslocamento=deslocamento&status=&clienteId=clienteId
  * Node Name: `http://api:3000/api/v1/orders (clienteId,deslocamento,limite,status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/
  * Node Name: `http://api:3000/api/v1/orders/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/6340135442825142013
  * Node Name: `http://api:3000/api/v1/orders/6340135442825142013`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id
  * Node Name: `http://api:3000/api/v1/orders/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/
  * Node Name: `http://api:3000/api/v1/orders/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/7716594571482663027
  * Node Name: `http://api:3000/api/v1/orders/id/7716594571482663027`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/parts
  * Node Name: `http://api:3000/api/v1/orders/id/parts`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/parts/
  * Node Name: `http://api:3000/api/v1/orders/id/parts/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/parts/4064288655097189839
  * Node Name: `http://api:3000/api/v1/orders/id/parts/4064288655097189839`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services
  * Node Name: `http://api:3000/api/v1/orders/id/services`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/
  * Node Name: `http://api:3000/api/v1/orders/id/services/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/1382919134617979340
  * Node Name: `http://api:3000/api/v1/orders/id/services/1382919134617979340`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/itemId
  * Node Name: `http://api:3000/api/v1/orders/id/services/itemId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/itemId/
  * Node Name: `http://api:3000/api/v1/orders/id/services/itemId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/itemId/1166189044117499857
  * Node Name: `http://api:3000/api/v1/orders/id/services/itemId/1166189044117499857`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts%3Flimite=limite&deslocamento=deslocamento&tipo=&ativo=
  * Node Name: `http://api:3000/api/v1/parts (ativo,deslocamento,limite,tipo)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/
  * Node Name: `http://api:3000/api/v1/parts/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/7296147381319664519
  * Node Name: `http://api:3000/api/v1/parts/7296147381319664519`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id
  * Node Name: `http://api:3000/api/v1/parts/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/
  * Node Name: `http://api:3000/api/v1/parts/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/7888152565788955516
  * Node Name: `http://api:3000/api/v1/parts/id/7888152565788955516`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements
  * Node Name: `http://api:3000/api/v1/parts/id/movements`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements%3Flimite=limite&deslocamento=deslocamento
  * Node Name: `http://api:3000/api/v1/parts/id/movements (deslocamento,limite)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements/
  * Node Name: `http://api:3000/api/v1/parts/id/movements/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements/5333879001423907351
  * Node Name: `http://api:3000/api/v1/parts/id/movements/5333879001423907351`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements/movimentoId
  * Node Name: `http://api:3000/api/v1/parts/id/movements/movimentoId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements/movimentoId/
  * Node Name: `http://api:3000/api/v1/parts/id/movements/movimentoId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements/movimentoId/466627928282028774
  * Node Name: `http://api:3000/api/v1/parts/id/movements/movimentoId/466627928282028774`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/quotes
  * Node Name: `http://api:3000/api/v1/quotes`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/quotes/
  * Node Name: `http://api:3000/api/v1/quotes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/quotes/9010575013579959638
  * Node Name: `http://api:3000/api/v1/quotes/9010575013579959638`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/quotes/id
  * Node Name: `http://api:3000/api/v1/quotes/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/quotes/id/
  * Node Name: `http://api:3000/api/v1/quotes/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/quotes/id/1419886219895741909
  * Node Name: `http://api:3000/api/v1/quotes/id/1419886219895741909`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/services%3Flimite=limite&deslocamento=deslocamento&ativo=
  * Node Name: `http://api:3000/api/v1/services (ativo,deslocamento,limite)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/services/
  * Node Name: `http://api:3000/api/v1/services/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/services/4605089042107395906
  * Node Name: `http://api:3000/api/v1/services/4605089042107395906`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/services/id
  * Node Name: `http://api:3000/api/v1/services/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/services/id/
  * Node Name: `http://api:3000/api/v1/services/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles%3Flimite=limite&deslocamento=deslocamento&clienteId=clienteId&placa=placa&ativo=
  * Node Name: `http://api:3000/api/v1/vehicles (ativo,clienteId,deslocamento,limite,placa)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles/
  * Node Name: `http://api:3000/api/v1/vehicles/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles/8744720718626762466
  * Node Name: `http://api:3000/api/v1/vehicles/8744720718626762466`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles/id
  * Node Name: `http://api:3000/api/v1/vehicles/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles/id/
  * Node Name: `http://api:3000/api/v1/vehicles/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/id
  * Node Name: `http://api:3000/api/v1/customers/id ()({nome,email,telefone,ativo})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/id/
  * Node Name: `http://api:3000/api/v1/customers/id/ ()({nome,email,telefone,ativo})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id
  * Node Name: `http://api:3000/api/v1/parts/id ()({nome,precoCentavos,ativo})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/
  * Node Name: `http://api:3000/api/v1/parts/id/ ()({nome,precoCentavos,ativo})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/services/id
  * Node Name: `http://api:3000/api/v1/services/id ()({nome,descricao,precoCentavos,ativo})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/services/id/
  * Node Name: `http://api:3000/api/v1/services/id/ ()({nome,descricao,precoCentavos,ativo})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles/id
  * Node Name: `http://api:3000/api/v1/vehicles/id ()({clienteId,marca,modelo,ano,ativo})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles/id/
  * Node Name: `http://api:3000/api/v1/vehicles/id/ ()({clienteId,marca,modelo,ano,ativo})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/login
  * Node Name: `http://api:3000/api/v1/auth/login ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/login
  * Node Name: `http://api:3000/api/v1/auth/login ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/login/
  * Node Name: `http://api:3000/api/v1/auth/login/ ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers
  * Node Name: `http://api:3000/api/v1/customers ()({documento,nome,email,telefone})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers
  * Node Name: `http://api:3000/api/v1/customers ()({documento,nome,email,telefone})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `409`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/
  * Node Name: `http://api:3000/api/v1/customers/ ()({documento,nome,email,telefone})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/id/user
  * Node Name: `http://api:3000/api/v1/customers/id/user ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/id/user/
  * Node Name: `http://api:3000/api/v1/customers/id/user/ ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders
  * Node Name: `http://api:3000/api/v1/orders ()({clienteId,veiculoId,solicitacao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/
  * Node Name: `http://api:3000/api/v1/orders/ ()({clienteId,veiculoId,solicitacao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/consumptions
  * Node Name: `http://api:3000/api/v1/orders/id/consumptions ()({itemOrcamentoId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/consumptions/
  * Node Name: `http://api:3000/api/v1/orders/id/consumptions/ ()({itemOrcamentoId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/deliver
  * Node Name: `http://api:3000/api/v1/orders/id/deliver ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/deliver/
  * Node Name: `http://api:3000/api/v1/orders/id/deliver/ ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/diagnosis
  * Node Name: `http://api:3000/api/v1/orders/id/diagnosis ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/diagnosis/
  * Node Name: `http://api:3000/api/v1/orders/id/diagnosis/ ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/finish
  * Node Name: `http://api:3000/api/v1/orders/id/finish ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/finish/
  * Node Name: `http://api:3000/api/v1/orders/id/finish/ ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/parts
  * Node Name: `http://api:3000/api/v1/orders/id/parts ()({pecaId,quantidade})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/parts/
  * Node Name: `http://api:3000/api/v1/orders/id/parts/ ()({pecaId,quantidade})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/quotes
  * Node Name: `http://api:3000/api/v1/orders/id/quotes ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/quotes/
  * Node Name: `http://api:3000/api/v1/orders/id/quotes/ ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/reopen
  * Node Name: `http://api:3000/api/v1/orders/id/reopen ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/reopen/
  * Node Name: `http://api:3000/api/v1/orders/id/reopen/ ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services
  * Node Name: `http://api:3000/api/v1/orders/id/services ()({servicoId,quantidade})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/
  * Node Name: `http://api:3000/api/v1/orders/id/services/ ()({servicoId,quantidade})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/itemId/complete
  * Node Name: `http://api:3000/api/v1/orders/id/services/itemId/complete`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/services/itemId/complete/
  * Node Name: `http://api:3000/api/v1/orders/id/services/itemId/complete/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/start
  * Node Name: `http://api:3000/api/v1/orders/id/start ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/orders/id/start/
  * Node Name: `http://api:3000/api/v1/orders/id/start/ ()({versao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts
  * Node Name: `http://api:3000/api/v1/parts ()({sku,nome,tipo,unidade,precoCentavos})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/
  * Node Name: `http://api:3000/api/v1/parts/ ()({sku,nome,tipo,unidade,precoCentavos})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements
  * Node Name: `http://api:3000/api/v1/parts/id/movements ()({tipo,quantidade,observacao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements/
  * Node Name: `http://api:3000/api/v1/parts/id/movements/ ()({tipo,quantidade,observacao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements/movimentoId/reversal
  * Node Name: `http://api:3000/api/v1/parts/id/movements/movimentoId/reversal ()({observacao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/parts/id/movements/movimentoId/reversal/
  * Node Name: `http://api:3000/api/v1/parts/id/movements/movimentoId/reversal/ ()({observacao})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/quotes/id/decision
  * Node Name: `http://api:3000/api/v1/quotes/id/decision ()({decisao,motivo})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/quotes/id/decision/
  * Node Name: `http://api:3000/api/v1/quotes/id/decision/ ()({decisao,motivo})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/services
  * Node Name: `http://api:3000/api/v1/services ()({nome,descricao,precoCentavos})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/services/
  * Node Name: `http://api:3000/api/v1/services/ ()({nome,descricao,precoCentavos})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles
  * Node Name: `http://api:3000/api/v1/vehicles ()({clienteId,placa,marca,modelo,ano})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://api:3000/api/v1/vehicles/
  * Node Name: `http://api:3000/api/v1/vehicles/ ()({clienteId,placa,marca,modelo,ano})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/computeMetadata/v1/
  * Node Name: `http://api:3000/computeMetadata/v1/ ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/latest/meta-data/
  * Node Name: `http://api:3000/latest/meta-data/ ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/metadata/instance
  * Node Name: `http://api:3000/metadata/instance ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/metadata/v1
  * Node Name: `http://api:3000/metadata/v1 ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/opc/v1/instance/
  * Node Name: `http://api:3000/opc/v1/instance/ ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/opc/v2/instance/
  * Node Name: `http://api:3000/opc/v2/instance/ ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/openstack/latest/meta_data.json
  * Node Name: `http://api:3000/openstack/latest/meta_data.json ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``


Instances: 152

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://api:3000/api/v1/auth/me
  * Node Name: `http://api:3000/api/v1/auth/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers%3Flimite=limite&deslocamento=deslocamento&documento=documento&nome=nome&ativo=
  * Node Name: `http://api:3000/api/v1/customers (ativo,deslocamento,documento,limite,nome)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://api:3000/api/v1/health
  * Node Name: `http://api:3000/api/v1/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/login
  * Node Name: `http://api:3000/api/v1/auth/login ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers
  * Node Name: `http://api:3000/api/v1/customers ()({documento,nome,email,telefone})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-store`
  * Other Info: ``

Instances: Systemic


### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3


