export function getNextCloneNumber(records) {
  const list = records || [];

  if (!list.length) {
    return 1;
  }

  return (
    list.reduce(function (max, record) {
      return Math.max(max, Number(record.clone_number) || 0);
    }, 0) + 1
  );
}
