import Image from "next/image";
import Link from "next/link";

import { getVersion } from "../../lib/getVersion";

const Logo = () => {
  const version = getVersion();
  return (
    <div className="flex justify-between">
      <Link href="/">
        <Image
          src="/images/logo_PECAT_horizontal.png"
          alt="logo"
          width={150}
          height={51}
          style={{
            height: 51,
            width: 150,
            marginTop: 7,
          }}
        />
      </Link>
      <code
        className="text-xs text-gray-500 ml-2"
        style={{
          marginTop: 35,
        }}
      >
        v{version}
      </code>
    </div>
  );
};

export default Logo;
