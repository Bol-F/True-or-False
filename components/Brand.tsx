import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      aria-label="RuFact — на главную"
      className="focus-ring inline-flex items-center gap-3 rounded-lg text-ink no-underline"
    >
      <span className="relative block h-9 w-9" aria-hidden="true">
        <span className="absolute left-0 top-1 h-7 w-4 rotate-[13deg] rounded-[70%_35%_68%_32%] bg-[#113656]" />
        <span className="absolute bottom-0 right-0 h-7 w-4 rotate-[32deg] rounded-[35%_70%_32%_68%] bg-[#e27a42]" />
      </span>
      <span className="font-serif text-[30px] font-bold tracking-[-0.045em] sm:text-[32px]">
        RuFact
      </span>
    </Link>
  );
}
