import React from "react";
import ContentLoader from "react-content-loader" 


export const Loading = () => {
  return <div>
    <ContentLoader 
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
    </ContentLoader>
  </div>;
};
