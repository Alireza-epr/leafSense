// debounce: delays execution of a function until after a certain period of inactivity.
// If the function is called again during that period, the timer resets.
// Only the last call within the delay will actually run.
// Useful for avoiding multiple rapid API calls (e.g., typing in search, moving a map).
// Call 1 → starts 300ms timer
// Call 2 (before 300ms) → resets timer, previous call canceled
// Call 3 (before 300ms) → resets timer again

export const debounce = (a_Function: (...args: any[]) => void, a_Delay: number = 300) => {
    let timer: number;

    return (...args: any[]) => { 
        clearTimeout(timer)
        timer = setTimeout( () => a_Function(...args) , a_Delay)
    }
}

// throttle: ensures a function is executed at most once every specified time period.
// If the function is called multiple times within that period, extra calls are ignored.
// Useful for limiting how often an API call or expensive operation runs (e.g., scrolling, dragging, rapid clicks).
// Call 1 → runs immediately, starts the delay window
// Call 2 (within delay) → ignored
// Call 3 (within delay) → ignored
// After delay passes → next call will run, and the cycle repeats

export const throttle = (a_Function: (...args: any[]) => void, a_Delay: number = 1000) => {
    let last : number = 0;
    
    const innerThrottle = (...args) => {
        const now = Date.now()
        if( (now - last) >= a_Delay){
            last = now
            a_Function(...args)
        }
    }

    return innerThrottle
}

/* 
| Feature     | Debounce             | Throttle                                |
| ----------- | -------------------- | --------------------------------------- |
| Fires       | After inactivity     | At regular intervals                    |
| Rapid calls | Only last call fires | First (or every interval) call fires    |
| Use case    | Typing, search input | Scroll events, map panning, button spam |
 */



export class CacheHandler {

    private _cache = new Map<string, any>()

    constructor() {

    }

    private _generateCacheKey (a_Params: { [key: string]: any}) {
        const sortedParams = Object.keys(a_Params).sort()

        let key: string[] = []

        for(const paramKey of sortedParams ){
            let paramValue = ''
            if(Array.isArray(a_Params[paramKey]) || typeof a_Params[paramKey] === "object"){
                paramValue = JSON.stringify(a_Params[paramKey])
            } else {
                paramValue = `${a_Params[paramKey]}`
            }
            
            key.push(`${paramKey}=${paramValue}`)
        }

        return key.join("&")
    }

    setCache (a_Key: any, a_Value: any) {
        const key = this._generateCacheKey(a_Key)
        this._cache.set(key, a_Value)
    }

    getCache (a_Key: any) {
        const key = this._generateCacheKey(a_Key)
        if(this._cache.has(key)){
            return this._cache.get(key)
        }
    }

}

