# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 4 |
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
| Info | Informational | http://api:3000 | Percentage of slow responses | 1 % |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| A Server Error response code was returned by the server | Low | 1 |
| Cross-Origin-Resource-Policy Header Missing or Invalid | Low | Systemic |
| Unexpected Content-Type was returned | Low | 2 |
| X-Content-Type-Options Header Missing | Low | Systemic |
| A Client Error response code was returned by the server | Informational | 152 |
| Non-Storable Content | Informational | Systemic |




## Alert Detail



### [ A Server Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Low (High)

### Description

A response code of 500 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://api:3000/api/v1/services
  * Node Name: `http://api:3000/api/v1/services ()({nome,descricao,precoCentavos})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `500`
  * Other Info: ``


Instances: 1

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Cross-Origin-Resource-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Resource-Policy header is an opt-in header designed to counter side-channels attacks like Spectre. Resource should be specifically set as shareable amongst different origins.

* URL: http://api:3000/api/docs/json
  * Node Name: `http://api:3000/api/docs/json`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/me
  * Node Name: `http://api:3000/api/v1/auth/me`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://api:3000/api/v1/health
  * Node Name: `http://api:3000/api/v1/health`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://api:3000/api/v1/customers
  * Node Name: `http://api:3000/api/v1/customers ()({documento,nome,email,telefone})`
  * Method: `POST`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://api:3000/api/v1/services
  * Node Name: `http://api:3000/api/v1/services ()({nome,descricao,precoCentavos})`
  * Method: `POST`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that the application/web server sets the Cross-Origin-Resource-Policy header appropriately, and that it sets the Cross-Origin-Resource-Policy header to 'same-origin' for all web pages.
'same-site' is considered as less secured and should be avoided.
If resources must be shared, set the header to 'cross-origin'.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Resource-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-resource-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

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

### [ X-Content-Type-Options Header Missing ](https://www.zaproxy.org/docs/alerts/10021/)



##### Low (Medium)

### Description

The Anti-MIME-Sniffing header X-Content-Type-Options was not set to 'nosniff'. This allows older versions of Internet Explorer and Chrome to perform MIME-sniffing on the response body, potentially causing the response body to be interpreted and displayed as a content type other than the declared content type. Current (early 2014) and legacy versions of Firefox will use the declared content type (if one is set), rather than performing MIME-sniffing.

* URL: http://api:3000/api/docs/json
  * Node Name: `http://api:3000/api/docs/json`
  * Method: `GET`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`
* URL: http://api:3000/api/v1/auth/me
  * Node Name: `http://api:3000/api/v1/auth/me`
  * Method: `GET`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`
* URL: http://api:3000/api/v1/health
  * Node Name: `http://api:3000/api/v1/health`
  * Method: `GET`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`
* URL: http://api:3000/api/v1/customers
  * Node Name: `http://api:3000/api/v1/customers ()({documento,nome,email,telefone})`
  * Method: `POST`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`
* URL: http://api:3000/api/v1/services
  * Node Name: `http://api:3000/api/v1/services ()({nome,descricao,precoCentavos})`
  * Method: `POST`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`

Instances: Systemic


### Solution

Ensure that the application/web server sets the Content-Type header appropriately, and that it sets the X-Content-Type-Options header to 'nosniff' for all web pages.
If possible, ensure that the end user uses a standards-compliant and modern web browser that does not perform MIME-sniffing at all, or that can be directed by the web application/web server to not perform MIME-sniffing.

### Reference


* [ https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/gg622941(v=vs.85) ](https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/gg622941(v=vs.85))
* [ https://owasp.org/www-community/Security_Headers ](https://owasp.org/www-community/Security_Headers)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 15

#### Source ID: 3

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
* URL: http://api:3000/5611291284738635183
  * Node Name: `http://api:3000/5611291284738635183`
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
* URL: http://api:3000/api/1317083731242062025
  * Node Name: `http://api:3000/api/1317083731242062025`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://api:3000/api/docs/2373715133042269970
  * Node Name: `http://api:3000/api/docs/2373715133042269970`
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
* URL: http://api:3000/api/v1/4679977912060661759
  * Node Name: `http://api:3000/api/v1/4679977912060661759`
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
* URL: http://api:3000/api/v1/auth/4716490018149986471
  * Node Name: `http://api:3000/api/v1/auth/4716490018149986471`
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
* URL: http://api:3000/api/v1/customers/9043940973683414342
  * Node Name: `http://api:3000/api/v1/customers/9043940973683414342`
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
* URL: http://api:3000/api/v1/customers/id/5318317932761000292
  * Node Name: `http://api:3000/api/v1/customers/id/5318317932761000292`
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
* URL: http://api:3000/api/v1/me/1039956544907106779
  * Node Name: `http://api:3000/api/v1/me/1039956544907106779`
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
* URL: http://api:3000/api/v1/me/orders/740360975755414374
  * Node Name: `http://api:3000/api/v1/me/orders/740360975755414374`
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
* URL: http://api:3000/api/v1/metrics/6584966634736599360
  * Node Name: `http://api:3000/api/v1/metrics/6584966634736599360`
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
* URL: http://api:3000/api/v1/orders/6452895285783558905
  * Node Name: `http://api:3000/api/v1/orders/6452895285783558905`
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
* URL: http://api:3000/api/v1/orders/id/1446616624301658562
  * Node Name: `http://api:3000/api/v1/orders/id/1446616624301658562`
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
* URL: http://api:3000/api/v1/orders/id/parts/2630666337871770823
  * Node Name: `http://api:3000/api/v1/orders/id/parts/2630666337871770823`
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
* URL: http://api:3000/api/v1/orders/id/services/5182338860076341277
  * Node Name: `http://api:3000/api/v1/orders/id/services/5182338860076341277`
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
* URL: http://api:3000/api/v1/orders/id/services/itemId/8679625714200628997
  * Node Name: `http://api:3000/api/v1/orders/id/services/itemId/8679625714200628997`
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
* URL: http://api:3000/api/v1/parts/1619521314041093506
  * Node Name: `http://api:3000/api/v1/parts/1619521314041093506`
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
* URL: http://api:3000/api/v1/parts/id/8672275841260027885
  * Node Name: `http://api:3000/api/v1/parts/id/8672275841260027885`
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
* URL: http://api:3000/api/v1/parts/id/movements/2281366455116771054
  * Node Name: `http://api:3000/api/v1/parts/id/movements/2281366455116771054`
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
* URL: http://api:3000/api/v1/parts/id/movements/movimentoId/963515021899721221
  * Node Name: `http://api:3000/api/v1/parts/id/movements/movimentoId/963515021899721221`
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
* URL: http://api:3000/api/v1/quotes/3559035253789531652
  * Node Name: `http://api:3000/api/v1/quotes/3559035253789531652`
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
* URL: http://api:3000/api/v1/quotes/id/5325072112046610676
  * Node Name: `http://api:3000/api/v1/quotes/id/5325072112046610676`
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
* URL: http://api:3000/api/v1/services/5308840828022800658
  * Node Name: `http://api:3000/api/v1/services/5308840828022800658`
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
* URL: http://api:3000/api/v1/vehicles/6696601563888904813
  * Node Name: `http://api:3000/api/v1/vehicles/6696601563888904813`
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
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers/id
  * Node Name: `http://api:3000/api/v1/customers/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://api:3000/api/v1/health
  * Node Name: `http://api:3000/api/v1/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://api:3000/api/v1/auth/login
  * Node Name: `http://api:3000/api/v1/auth/login ()({email,senha})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://api:3000/api/v1/customers
  * Node Name: `http://api:3000/api/v1/customers ()({documento,nome,email,telefone})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
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


