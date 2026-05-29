// Normalize POSIX-style locale strings (e.g. `en_US`, `en-US.utf8`) to BCP-47 form (`en-US`)
// by dropping any codeset/modifier suffix and using `-` as the subtag separator.
export const normalizeLocale = locale => locale.split(/[.@]/)[0].replace(/_/g, '-');
