import React from 'react';

type Props = { children: React.ReactNode };

const Layout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 w-20 h-screen bg-white border-r border-gray-200 flex flex-col items-center py-4" />
      <main className="ml-20 p-8">{children}</main>
    </div>
  );
};

export default Layout;