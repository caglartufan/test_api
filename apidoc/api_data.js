define({ "api": [
  {
    "type": "get",
    "url": "/users/me",
    "title": "Request the authorized user",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>JWT authorization token</p>"
          }
        ]
      }
    },
    "name": "GetUser",
    "group": "User",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>ObjectId of the authorized user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>Username of the authorized user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "documents",
            "description": "<p>Array of document ObjectIds of the authorized user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "joinDate",
            "description": "<p>Join date of the authorized user.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "__v",
            "description": "<p>Version of the user object.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"_id\": \"609c424a2cee6929d4acfdc2\",\n  \"username\": \"johndoe\",\n  \"documents\": [\n    \"609c424a2cee6929d4acfdc3\",\n    \"609c424a2cee6929d4acfdc4\"\n  ],\n  \"joinDate\": \"2021-05-12T21:02:02.126Z\",\n  \"__v\": 0\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/me"
      }
    ]
  }
] });
