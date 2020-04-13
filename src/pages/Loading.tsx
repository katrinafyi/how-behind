import React from "react";

{/* <ContentLoader 
  animate={false}
  viewBox="0 0 400 160"
  backgroundColor="#f3f3f3"
  foregroundColor="#ecebeb"
  style={{width: '100%'}}
  title=""
>
  <rect x="0" y="56" rx="3" ry="3" width="497" height="6" /> 
  <rect x="0" y="72" rx="3" ry="3" width="380" height="6" /> 
  <rect x="0" y="88" rx="3" ry="3" width="178" height="6" /> 
  <rect x="0" y="28" rx="3" ry="3" width="254" height="18" /> 
  <rect x="0" y="6" rx="3" ry="3" width="180" height="12" />
</ContentLoader> */}

export const Loading = () => {
  const bg = 'has-background-white-ter has-text-white-ter';
  
  return <div style={{userSelect: 'none'}}>
    <div style={{marginBottom: '0.3rem'}}>
      <span className={"is-size-4 " + bg}>Monday, 13 April 2020</span>
    </div>

    <progress className="progress is-small is-link" max="100"
      style={{marginBottom: '0.2rem', height: '0.2rem', visibility: 'hidden'}}
    ></progress>
        
    <div className="block" style={{ marginBottom: '0.75rem' }}>
      <span className={"title is-2 " + bg} style={{ fontWeight: 'normal' }}>You are behind 10 hours,</span>
    </div>

    <div className="is-size-6" style={{ marginBottom: '0.75rem' }}>
      <span className={bg}>which is made up of</span> <span className={bg}>which is made up of which</span> <span className={bg}>3 MATH3401</span> <span className={bg}>1 hour of STAT3001</span> <span className={bg}>STAT3001</span> <span className={bg}>1 hour of and something else STAT3001</span>
    </div>
  </div>;
};
