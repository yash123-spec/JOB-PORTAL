// src/Components/layout/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Scrolls the window to the top whenever the route (pathname) changes.
// React Router preserves scroll position across navigations by default, which
// makes a newly opened page appear scrolled down. Mounting this once inside the
// Router resets every page to the top on navigation. Renders nothing.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
