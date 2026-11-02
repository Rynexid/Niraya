import Image from "next/image";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <Image src="/Logo.png" alt="NIRAYA POS" width={32} height={32} className="rounded-md" />
            <span>NIRAYA POS</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-white lg:block dark:bg-muted">
        <Image
          src="/logincover.png"
          alt="NIRAYA POS"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
