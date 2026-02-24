# Server

## Database ERD

```mermaid
erDiagram
  site_map_entity {
    uuid id PK
    timestamp createdAt
    timestamp updatedAt
    varchar url
    varchar title
    varchar publicationDate
    text keywords
  }
  
```
