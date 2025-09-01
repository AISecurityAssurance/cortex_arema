"use client";

import React from "react";
import { AppLayout } from "@cloudscape-design/components";
import { CustomTopNavigation } from "./CustomTopNavigation";

interface CloudscapeLayoutProps {
  children: React.ReactNode;
}

export function CloudscapeLayout({ children }: CloudscapeLayoutProps) {
  return (
    <>
      <div id="navbar">
        <CustomTopNavigation />
      </div>
      
      <AppLayout
        navigationHide={true}
        content={children}
        headerSelector="#navbar"
        toolsHide={true}
        contentType="default"
        disableContentPaddings={true}
        maxContentWidth={Number.POSITIVE_INFINITY}
      />
    </>
  );
}