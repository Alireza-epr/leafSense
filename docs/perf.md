## Performance Metrics

| Metric | Before | After |
|------|--------|-------|
| LCP | ~5.5s | ~4.8s |
| FCP | ~3s | ~2.9s |
| CLS | 0.01 | 0.01 |
| TBT | 20ms | 20ms |

### Notes
- Code-split MapLibre and chart components ( in progress )
- Debounced STAC fetch and NDVI computation
- Cached NDVI results and STAC features
