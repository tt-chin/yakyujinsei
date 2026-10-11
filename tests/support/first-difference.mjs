// Diagnostic only: never normalizes or changes the compared state/expectations.
export function findFirstDifference(a,b,p='$') {
  if(a===b)return null;
  if(a&&b&&typeof a==='object'&&typeof b==='object') {
    for(const key of new Set([...Object.keys(a),...Object.keys(b)])) {
      if(!Object.hasOwn(a,key)||!Object.hasOwn(b,key))return {path:p+'.'+key,before:Object.hasOwn(a,key)?a[key]:'<missing>',after:Object.hasOwn(b,key)?b[key]:'<missing>'};
      const d=findFirstDifference(a[key],b[key],p+'.'+key);if(d)return d;
    }
    return null;
  }
  return {path:p,before:a,after:b};
}
