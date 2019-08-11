export default {
  schema: [
    {
      schema: {
        "title": "Schema",
        "type": "object",
        "options": {
          //"selectPropeties": true
        },
        //"required": [
        //  'a'
        //],
        "properties": {
          "a": {
            "description": "A string",
            "type": "string"
          },
          "b": {
            "title": "b objects",
            "type": "array",
            "items": {
              "$ref": "#/"
            }
          }
        }
      }
    }
  ],
  person: [
    {
      schema: {
        "title": "Person",
        "type": "object",
        "required": [
          "name",
          "age",
          "date",
          //"favorite_color",
          "gender",
          "location",
          "pets"
        ],
        "properties": {
          "name": {
            "type": "string",
            "description": "First and Last name",
            "minLength": 4,
            "default": "Artur Augusto Martins",
          },
          "age": {
            "type": "integer",
            "default": 25,
            "minimum": 18,
            "maximum": 99
          },
          "gender": {
            "type": "string",
            "enum": [
              "male",
              "female"
            ]
          },
          "date": {
            "type": "string"
            //"format": "date"
          },
          "aa": {
            "type": "string",
            "enum": ["a", "b"]
          },
          "pets": {
            "type": "array",
            //"format": "table",
            "title": "Pets",
            "uniqueItems": true,
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "cat",
                    "dog",
                    "bird",
                    "reptile",
                    "other"
                  ],
                  "default": "dog"
                },
                "name": {
                  "type": "string"
                }
              }
            },
            "default": [
              {
                "type": "dog",
                "name": "Walter"
              }
            ]
          }
        }
      },
      up: (data) => {return data}, // called when migrating from this to a next version
      down: (data) => {return data} // called when migrating from this to a previous version
    } // 0
  ],
  pet: [
    {
      schema: {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "cat",
              "dog",
              "bird",
              "reptile",
              "other"
            ],
            "default": "dog"
          },
          "name": {
            "type": "string"
          }
        }
      },
      up: (data) => {return data}, // called when migrating from this to a next version
      down: (data) => {return data} // called when migrating from this to a previous version
    } // 0
  ]
}
