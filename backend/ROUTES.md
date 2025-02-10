# API Routes
All routes will be listed and planned here.

[Reference for most API Request (Who Is, Register Domain, etc.)](https://www.namesilo.com/api-reference#domains/register-domain).

## Response
```json
{
    "status": string,
    "message": {} | string,
}
```

### Example Response
```json
{
    "status": "OK",
    "message": {
        "domain": "whoapi.com",
        "registered": true,
        "changed": "2023-08-30",
        "created": "2011-02-14",
        "expires": "2026-02-14",
        "registrar": "TurnCommerce, Inc. DBA NameBright.com",
    },
}
```


## ---------- START ----------
Every route begins with: /api/
Example URL: localhost:300/api/...

✅: Implemented
⌛: Currently working on
❌: Not implemented

/isAvailable/:domains (✅)
- :domains -> replace with a list of domains. e.g.: domain.com,whoapi.com,namesilo.com

/whoIs/:domain (✅)
- :domain -> replace with a domain. e.g.: domain.com
