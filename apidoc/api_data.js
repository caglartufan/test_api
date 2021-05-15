define({ "api": [
  {
    "type": "post",
    "url": "/auth",
    "title": "1. Authenticate user",
    "version": "0.1.0",
    "name": "Auth",
    "group": "Auth",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>New username of the user that is authorized.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>New password of the user that is authorized.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "jwt",
            "description": "<p>Generated JSON Web Token for use in future API calls</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"jwt\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDljNDI0YTJjZWU2OTI5ZDRhY2ZkYzIiLCJpc0FkbWluIjp0cnVlLCJ1c2VybmFtZSI6Im4zcGl4IiwiaWF0IjoxNjIwODk3MzI3fQ.3eoy2rCjwrg4CiWZMW5qRU37ztQbEk4gJ0bsP8XEprw\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "ValidationError",
            "description": "<p>Given body fields (<code>username, password</code>) are not valid.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "InvalidUsernameOrPassword",
            "description": "<p>Username or password is not correct.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "ValidationError:",
          "content": "HTTP/1.1 400 ValidationError\n{\n  \"error\": {\n    \"message\": \"\\\"username\\\" length must be at least 3 characters long\",\n    \"statusCode\": 400\n  }\n}",
          "type": "json"
        },
        {
          "title": "InvalidUsernameOrPassword:",
          "content": "HTTP/1.1 404 InvalidUsernameOrPassword\n{\n  \"error\": {\n    \"message\": \"Invalid username or password\",\n    \"statusCode\": 404\n  }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "routes/auth.js",
    "groupTitle": "Auth",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/auth"
      }
    ]
  },
  {
    "type": "get",
    "url": "/documents/mine",
    "title": "1. Request the authorized user's documents as a list",
    "version": "0.1.0",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>JWT authorization token.</p>"
          }
        ]
      }
    },
    "name": "GetMine",
    "group": "Documents",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "documents",
            "description": "<p>Documents of authorized user.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "documents._id",
            "description": "<p>ObjectId of the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "documents.filename",
            "description": "<p>Name of the file saved in the disk storage.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "documents.path",
            "description": "<p>Path to the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "documents.size",
            "description": "<p>Size of the document in bytes.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "documents.uploadDate",
            "description": "<p>Upload date of the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "documents.__v",
            "description": "<p>Version of the document object.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n  {\n    \"_id\": \"609c424a2cee6929d4acfdc2\",\n    \"filename\": \"johndoe--1620853594797.json\",\n    \"path\": \"/uploads/n3pix/johndoe--1620853594797.json\",\n    \"size\": 173\n    \"uploadDate\": \"2021-05-12T21:02:02.126Z\",\n    \"__v\": 0\n  },\n  {\n    \"_id\": \"609c424a2cee6929d4acfdc3\",\n    \"filename\": \"johndoe--1620853596061.json\",\n    \"path\": \"/uploads/n3pix/johndoe--1620853596061.json\",\n    \"size\": 185\n    \"uploadDate\": \"2021-05-12T22:02:02.126Z\",\n    \"__v\": 0\n  }\n]",
          "type": "json"
        }
      ]
    },
    "filename": "routes/documents.js",
    "groupTitle": "Documents",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/documents/mine"
      }
    ]
  },
  {
    "type": "get",
    "url": "/documents/mine/:documentId",
    "title": "2. Request the authorized user's document with provided document ObjectId",
    "version": "0.1.0",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>JWT authorization token.</p>"
          }
        ]
      }
    },
    "name": "GetMineById",
    "group": "Documents",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>ObjectId of the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "filename",
            "description": "<p>Name of the file saved in the disk storage.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "path",
            "description": "<p>Path to the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "size",
            "description": "<p>Size of the document in bytes.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "uploadDate",
            "description": "<p>Upload date of the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "__v",
            "description": "<p>Version of the document object.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"_id\": \"609c424a2cee6929d4acfdc2\",\n  \"filename\": \"johndoe--1620853594797.json\",\n  \"path\": \"/uploads/n3pix/johndoe--1620853594797.json\",\n  \"size\": 173\n  \"uploadDate\": \"2021-05-12T21:02:02.126Z\",\n  \"__v\": 0\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "documentIdNotValid",
            "description": "<p>Given document ObjectId is not a valid ObjectId.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "documentNotFound",
            "description": "<p>Document with given ObjectId could not found.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "documentIdNotValid:",
          "content": "HTTP/1.1 400 documentIdNotValid\n{\n  \"error\": {\n    \"message\": \"Girilen ID değeri uygun değil.\",\n    \"statusCode\": 400\n  }\n}",
          "type": "json"
        },
        {
          "title": "documentNotFound:",
          "content": "HTTP/1.1 404 documentNotFound\n{\n  \"error\": {\n    \"message\": \"Verilen ID değerine sahip doküman bulunamadı.\",\n    \"statusCode\": 404\n  }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "routes/documents.js",
    "groupTitle": "Documents",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/documents/mine/:documentId"
      }
    ]
  },
  {
    "type": "post",
    "url": "/documents/mine/",
    "title": "4. Create a new document for authorized user",
    "version": "0.1.0",
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
    "name": "PostMine",
    "group": "Documents",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "File",
            "optional": false,
            "field": "document",
            "description": "<p>Select the JSON file to create a document.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>ObjectId of the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "filename",
            "description": "<p>Name of the file saved in the disk storage.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "path",
            "description": "<p>Path to the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "size",
            "description": "<p>Size of the document in bytes.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "uploadDate",
            "description": "<p>Upload date of the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "__v",
            "description": "<p>Version of the document object.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"_id\": \"609c424a2cee6929d4acfdc2\",\n  \"filename\": \"johndoe--1620853594797.json\",\n  \"path\": \"/uploads/n3pix/johndoe--1620853594797.json\",\n  \"size\": 173\n  \"uploadDate\": \"2021-05-12T21:02:02.126Z\",\n  \"__v\": 0\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "fileNotSelected",
            "description": "<p>No file selected in form file input.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "planLimitExceeded",
            "description": "<p>User's current plan disk space is exceeded.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "fileNotSelected:",
          "content": "HTTP/1.1 400 fileNotSelected\n{\n  \"error\": {\n    \"message\": \"Herhangi bir doküman seçilmedi.\",\n    \"statusCode\": 400\n  }\n}",
          "type": "json"
        },
        {
          "title": "planLimitExceeded:",
          "content": "HTTP/1.1 403 planLimitExceeded\n{\n  \"error\": {\n    \"message\": \"Your plan's disk space is exceeded.\",\n    \"statusCode\": 403\n  }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "routes/documents.js",
    "groupTitle": "Documents",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/documents/mine/"
      }
    ]
  },
  {
    "type": "put",
    "url": "/documents/mine/:documentId",
    "title": "5. Update an existing document of authorized user",
    "version": "0.1.0",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>JWT authorization token.</p>"
          }
        ]
      }
    },
    "name": "PutMine",
    "group": "Documents",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "File",
            "optional": false,
            "field": "document",
            "description": "<p>Select the JSON file to update with existing document that is provided by documet ObjectId.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>ObjectId of the document.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "filename",
            "description": "<p>Name of the upldated file saved in the disk storage.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "path",
            "description": "<p>Path to the updated document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "size",
            "description": "<p>Size of the updated document in bytes.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "uploadDate",
            "description": "<p>Upload date (not updated) of the updated document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "__v",
            "description": "<p>Version of the document object.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"_id\": \"609c424a2cee6929d4acfdc2\",\n  \"filename\": \"johndoe--1620853594797.json\",\n  \"path\": \"/uploads/n3pix/johndoe--1620853594797.json\",\n  \"size\": 173\n  \"uploadDate\": \"2021-05-12T21:02:02.126Z\",\n  \"__v\": 0\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "documentIdNotValid",
            "description": "<p>Given document ObjectId is not a valid ObjectId.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "documentNotFound",
            "description": "<p>Document with given ObjectId could not found.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "fileNotSelected",
            "description": "<p>No file selected in form file input.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "planLimitExceeded",
            "description": "<p>User's current plan disk space is exceeded.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "documentIdNotValid:",
          "content": "HTTP/1.1 400 documentIdNotValid\n{\n  \"error\": {\n    \"message\": \"Girilen ID değeri uygun değil.\",\n    \"statusCode\": 400\n  }\n}",
          "type": "json"
        },
        {
          "title": "documentNotFound:",
          "content": "HTTP/1.1 404 documentNotFound\n{\n  \"error\": {\n    \"message\": \"Verilen ID değerine sahip doküman bulunamadı.\",\n    \"statusCode\": 404\n  }\n}",
          "type": "json"
        },
        {
          "title": "fileNotSelected:",
          "content": "HTTP/1.1 400 fileNotSelected\n{\n  \"error\": {\n    \"message\": \"Herhangi bir doküman seçilmedi.\",\n    \"statusCode\": 400\n  }\n}",
          "type": "json"
        },
        {
          "title": "planLimitExceeded:",
          "content": "HTTP/1.1 403 planLimitExceeded\n{\n  \"error\": {\n    \"message\": \"Your plan's disk space is exceeded.\",\n    \"statusCode\": 403\n  }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "routes/documents.js",
    "groupTitle": "Documents",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/documents/mine/:documentId"
      }
    ]
  },
  {
    "type": "delete",
    "url": "/documents/mine/:documentId",
    "title": "6. Remove a document of authorized user",
    "version": "0.1.0",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>JWT authorization token.</p>"
          }
        ]
      }
    },
    "name": "RemoveMine",
    "group": "Documents",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "_id",
            "description": "<p>ObjectId of the removed document</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "filename",
            "description": "<p>Name of the file removed in the disk storage.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "path",
            "description": "<p>Path to the removed document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "size",
            "description": "<p>Size of the removed document in bytes.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "uploadDate",
            "description": "<p>Upload date (not remove date) of the removed document.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "__v",
            "description": "<p>Version of the removed document object.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"_id\": \"609c424a2cee6929d4acfdc2\",\n  \"filename\": \"johndoe--1620853594797.json\",\n  \"path\": \"/uploads/n3pix/johndoe--1620853594797.json\",\n  \"size\": 173\n  \"uploadDate\": \"2021-05-12T21:02:02.126Z\",\n  \"__v\": 0\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "documentIdNotValid",
            "description": "<p>Given document ObjectId is not a valid ObjectId.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "documentNotFound",
            "description": "<p>Document with given ObjectId could not found.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "documentIdNotValid:",
          "content": "HTTP/1.1 400 documentIdNotValid\n{\n  \"error\": {\n    \"message\": \"Girilen ID değeri uygun değil.\",\n    \"statusCode\": 400\n  }\n}",
          "type": "json"
        },
        {
          "title": "documentNotFound:",
          "content": "HTTP/1.1 404 documentNotFound\n{\n  \"error\": {\n    \"message\": \"Verilen ID değerine sahip doküman bulunamadı.\",\n    \"statusCode\": 404\n  }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "routes/documents.js",
    "groupTitle": "Documents",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/documents/mine/:documentId"
      }
    ]
  },
  {
    "type": "get",
    "url": "/users/me/left-disk-space",
    "title": "2. Request the authorized user's left disk space",
    "version": "0.1.0",
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
    "name": "GetLeftDiskSpace",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "round",
            "description": "<p>Set round query parameter to <code>false</code> if you want <code>leftDiskSpaceInMbs</code> value to not rounded.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "leftDiskSpaceInBytes",
            "description": "<p>Authorized user's left disk space in bytes.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "leftDiskSpaceInMbs",
            "description": "<p>Authorized user's left disk space in MBs.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"leftDiskSpaceInBytes\": 52428203,\n  \"leftDiskSpaceInMbs\": 50\n}",
          "type": "json"
        }
      ]
    },
    "filename": "routes/users.js",
    "groupTitle": "Users",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/me/left-disk-space"
      }
    ]
  },
  {
    "type": "get",
    "url": "/users/me",
    "title": "1. Request the authorized user",
    "version": "0.1.0",
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
    "name": "GetMe",
    "group": "Users",
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
          "content": "HTTP/1.1 200 OK\n{\n  \"_id\": \"609c424a2cee6929d4acfdc2\",\n  \"username\": \"johndoe\",\n  \"plan\": \"free\",\n  \"documents\": [\n    \"609c424a2cee6929d4acfdc3\",\n    \"609c424a2cee6929d4acfdc4\"\n  ],\n  \"joinDate\": \"2021-05-12T21:02:02.126Z\",\n  \"__v\": 0\n}",
          "type": "json"
        }
      ]
    },
    "filename": "routes/users.js",
    "groupTitle": "Users",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/me"
      }
    ]
  },
  {
    "type": "put",
    "url": "/users/me",
    "title": "3. Update the authorized user",
    "version": "0.1.0",
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
    "name": "PutMe",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>New username of the user that is authorized.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>New password of the user that is authorized.</p>"
          }
        ]
      }
    },
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
            "type": "String",
            "optional": false,
            "field": "joinDate",
            "description": "<p>Join date of the authorized user.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"_id\": \"609c424a2cee6929d4acfdc2\",\n  \"username\": \"johndoe\",\n  \"plan\": \"free\",\n  \"joinDate\": \"2021-05-12T21:02:02.126Z\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "UsernameInUse",
            "description": "<p>Username is already in use.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>User with ObjectId provided by authorization token could not found.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "ValidationError",
            "description": "<p>Given request body fields are not valid. (eg <code>username</code>)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "UsernameInUse:",
          "content": "HTTP/1.1 400 UsernameInUse\n{\n  \"error\": {\n    \"message\": \"Girmiş olduğunuz kullanıcı adı kullanımda.\",\n    \"statusCode\": 400\n  }\n}",
          "type": "json"
        },
        {
          "title": "UserNotFound:",
          "content": "HTTP/1.1 404 UserNotFound\n{\n  \"error\": {\n    \"message\": \"Düzenlenmek istenen kullanıcı bulunamadı.\",\n    \"statusCode\": 404\n  }\n}",
          "type": "json"
        },
        {
          "title": "ValidationError:",
          "content": "HTTP/1.1 400 ValidationError\n{\n  \"error\": {\n    \"message\": \"Kullanıcı adınız sadece harf ve rakamlardan oluşmalıdır\",\n    \"statusCode\": 400\n  }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "routes/users.js",
    "groupTitle": "Users",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/me"
      }
    ]
  }
] });
