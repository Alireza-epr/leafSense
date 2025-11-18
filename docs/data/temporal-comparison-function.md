# Temporal Operators Examples

## t_after
**Explanation:** Finds items that happen after a given time.  
**Example:**
```json
{
  "filter": {
    "op": "t_after",
    "args": [
      { "property": "datetime" },
      "2025-01-01T00:00:00Z"
    ]
  }
}
```

## t_before
**Explanation:** Finds items that happen before a given time.  
**Example:**
```json
{
  "filter": {
    "op": "t_before",
    "args": [
      { "property": "datetime" },
      "2025-01-01T00:00:00Z"
    ]
  }
}
```

## t_contains
**Explanation:** Finds items whose time contains the given instant or range.  
**Example:**
```json
{
  "filter": {
    "op": "t_contains",
    "args": [
      { "property": "datetime" },
      "2025-01-15T12:00:00Z"
    ]
  }
}
```

## t_disjoint
**Explanation:** Finds items that do not overlap with the given time.  
**Example:**
```json
{
  "filter": {
    "op": "t_disjoint",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_during
**Explanation:** Finds items fully inside the given time range.  
**Example:**
```json
{
  "filter": {
    "op": "t_during",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_equals
**Explanation:** Finds items with the exact same datetime.  
**Example:**
```json
{
  "filter": {
    "op": "t_equals",
    "args": [
      { "property": "datetime" },
      "2025-01-15T12:00:00Z"
    ]
  }
}
```

## t_finishedby
**Explanation:** Finds items that end at the same time as the given range but start later.  
**Example:**
```json
{
  "filter": {
    "op": "t_finishedby",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_finishes
**Explanation:** Finds items that end at the same time as the given range but start earlier.  
**Example:**
```json
{
  "filter": {
    "op": "t_finishes",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_intersects
**Explanation:** Finds items that overlap with the given time.  
**Example:**
```json
{
  "filter": {
    "op": "t_intersects",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_meets
**Explanation:** Finds items that end exactly when the given time starts.  
**Example:**
```json
{
  "filter": {
    "op": "t_meets",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_metby
**Explanation:** Finds items that start exactly when the given time ends.  
**Example:**
```json
{
  "filter": {
    "op": "t_metby",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_overlappedby
**Explanation:** Finds items overlapped by the given time.  
**Example:**
```json
{
  "filter": {
    "op": "t_overlappedby",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_overlaps
**Explanation:** Finds items that partly overlap but are not fully inside the given range.  
**Example:**
```json
{
  "filter": {
    "op": "t_overlaps",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_startedby
**Explanation:** Finds items that start at the same time as the given range but end later.  
**Example:**
```json
{
  "filter": {
    "op": "t_startedby",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```

## t_starts
**Explanation:** Finds items that start at the same time as the given range but end earlier.  
**Example:**
```json
{
  "filter": {
    "op": "t_starts",
    "args": [
      { "property": "datetime" },
      { "interval": ["2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z"] }
    ]
  }
}
```


---
## Using comparison operators

| Operator | Meaning                | Example                                                          |
| -------- | ---------------------- | ---------------------------------------------------------------- |
| `<`      | Before a specific time | `"datetime" < "2024-05-01T00:00:00Z"` → items before May 1, 2024 |
| `<=`     | Before or exactly at   | `"datetime" <= "2024-05-01T00:00:00Z"`                           |
| `>`      | After a specific time  | `"datetime" > "2024-05-01T00:00:00Z"` → items after May 1, 2024  |
| `>=`     | After or exactly at    | `"datetime" >= "2024-05-01T00:00:00Z"`                           |


