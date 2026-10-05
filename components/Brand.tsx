import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      aria-label="RuFact — на главную"
      className="focus-ring inline-flex items-center gap-2 rounded-lg text-ink no-underline sm:gap-3"
    >
      <span className="relative block h-7 w-7 sm:h-9 sm:w-9" aria-hidden="true">
        <span className="absolute left-0 top-1 h-[22px] w-3 rotate-[13deg] rounded-[70%_35%_68%_32%] bg-[#113656] sm:h-7 sm:w-4" />
        <span className="absolute bottom-0 right-0 h-[22px] w-3 rotate-[32deg] rounded-[35%_70%_32%_68%] bg-[#e27a42] sm:h-7 sm:w-4" />
      </span>
      <span className="font-serif text-[25px] font-bold tracking-[-0.045em] sm:text-[32px]">
        RuFact
      </span>
    </Link>
  );
}
