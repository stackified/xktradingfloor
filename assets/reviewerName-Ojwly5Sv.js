function m(r,n="Anonymous"){const t=r?.userName||r?.userId?.fullName||r?.userId?.email||"",e=String(t).trim();return e?e.includes("@")?e.split("@")[0]||n:e:n}export{m as r};
