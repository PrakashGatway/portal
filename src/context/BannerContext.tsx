"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api from "../axiosInstance";

const BannerContext = createContext<any>(null);

export const UseBanner = () => useContext(BannerContext);

export const BannerProvider = ({ children }: any) => {
  const [banner, setBanner] = useState([]);

  useEffect(() => {
    api.get("/Banner").then((res) => {
      setBanner(res.data.data);
    });
  }, []);

  return (
    <BannerContext.Provider value={{ banner }}>
      {children}
    </BannerContext.Provider>
  );
};