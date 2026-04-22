exports.calculateHours = (signIn, signOut) => {
  const diff = new Date(signOut) - new Date(signIn);
  return diff / (1000 * 60 * 60); // hours
};