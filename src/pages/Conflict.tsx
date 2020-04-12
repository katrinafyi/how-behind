import React, { useState, useEffect } from "react";
import { RouteChildrenProps, withRouter, RouteComponentProps } from "react-router";
import firebase from "../services/firebase";
import { Storage } from "../services/storage";

interface ConflictProps extends RouteComponentProps {
  data: Storage,
  dataLoading: boolean,
}

export const Conflict = withRouter(({ location, data, dataLoading }: ConflictProps) => {
  const [oldData, setOldData] = useState<Storage | null>(null);
  const [newData, setNewData] = useState<Storage | null>(null);

  // console.log(location);
  let error: string | null = null;
  let credential = null;
  try {
    const json = new URLSearchParams(location.search).get('credential');
    credential = firebase.auth.AuthCredential.fromJSON(json!);
  } catch (e) {
    console.error("Error while parsing credential.", e);
    error = e.toString();
  }

  if (!error && !credential) {
    error = "Invalid credential object.";
  }

  useEffect(() => {
    if (data && !dataLoading && !oldData) {
      setOldData(data);
    }
  }, [data, dataLoading, oldData]);

  useEffect(() => {
    if (!oldData || error)
      return;
    
  }, [oldData, error]);



  if (error) {
    return <article className="message is-danger">
      <div className="message-body">
        Unable to parse new authentication credential. Please try again.<br/>
        <small>{error}</small>
      </div>
    </article>;
  }

  return <div>
    Conflict resolver.
  </div>;
});