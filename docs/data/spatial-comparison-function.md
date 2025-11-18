# How Each Spatial Operation Behaves With a 4-Point Polygon

When using the STAC API `op` parameter with a Polygon (4 coordinates), each spatial comparison operation defines a different type of relationship between **your polygon** and the **item’s geometry**.

Below is a simple explanation of what each operation includes and excludes.

---

## S_INTERSECTS

**Meaning:** Show any item that **touches** OR **overlaps** my polygon.

**Includes:**
- Items that overlap  
- Items that cross  
- Items that touch edges  
- Items completely inside  
- Items that completely contain your polygon  

**Excludes:**
- Items far away  
- Items with no contact  

> This is the *most commonly used* filter.

---

## S_WITHIN

**Meaning:** Show items that are **entirely inside** my polygon.

**Includes:**
- Items fully inside  

**Excludes:**
- Items partly inside  
- Items outside  
- Items larger than your polygon  
- Items touching the boundary  

> Think: “Give me only the items fully inside my area.”

---

## S_CONTAINS

**Meaning:** Show items that **my polygon completely contains**.

**Includes:**
- Items totally inside your polygon  

**Excludes:**
- Items crossing outside  
- Items touching the edge  
- Items larger than your polygon  

> This is the opposite of **S_WITHIN**, from your polygon’s perspective.

---

## S_CROSSES

**Meaning:** Show items that **cut through** the polygon.

**Includes:**
- Items crossing from one side to the other  
- Items whose edges pass through the polygon  

**Excludes:**
- Items fully inside  
- Items fully outside  
- Items only touching the boundary  

**Useful for:**  
- Roads  
- Flight paths  
- Streams  
- Boundaries  

---

## S_DISJOINT

**Meaning:** Show items that **do not touch** the polygon at all.

**Includes:**
- Items completely outside  

**Excludes:**
- Items touching the edge  
- Items overlapping  
- Items inside  

> Useful for finding items that are *far away*.

---

## S_EQUALS

**Meaning:** Show items whose geometry is **exactly the same** as your polygon.

**Includes:**
- Identical shape  
- Identical coordinates  

**Excludes:**
- Anything even slightly different  
- Larger  
- Smaller  
- Overlapping  

> Rarely used unless matching exact geometry.

---

## S_OVERLAPS

**Meaning:** Show items that share area with the polygon **but are not fully inside or fully outside**.

**Includes:**
- Items partially overlapping  

**Excludes:**
- Completely inside  
- Completely outside  
- Only touching edges  

> Useful for detecting area-based overlaps.

---

## S_TOUCHES

**Meaning:** Show items that **touch the polygon only at the boundary**.

**Includes:**
- Edge-to-edge touching  
- Corner-to-corner touching  

**Excludes:**
- Overlapping  
- Fully inside  
- Far away  

> Used for boundary interactions such as parcel edges.

---
## Difference Between S_WITHIN and S_CONTAINS
S_WITHIN	Image is inside your polygon
S_CONTAINS	Image fully covers your polygon