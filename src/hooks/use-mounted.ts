import { useEffect, useState } from "react";

/** Returns true once the component has mounted on the client.
 *  Useful to avoid hydration mismatches when reading from localStorage or theme. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
