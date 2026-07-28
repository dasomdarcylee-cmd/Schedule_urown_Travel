// 파란 돔 + 하얀 벽 교회를 나타낼 유니코드 이모지가 없어서 CSS로 대신 그리는 스와치.
export function CountryIconSwatch({ size = 18 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 border border-[#d8dbe0]"
      style={{
        height: size,
        width: size,
        borderRadius: `${size / 2}px ${size / 2}px ${size / 6}px ${size / 6}px`,
        background: "linear-gradient(to bottom, #2f6fdb 0%, #2f6fdb 45%, #ffffff 45%, #ffffff 100%)",
      }}
    />
  );
}
