module.exports = (client) => {
  client.getColor = (type, userProfile) => {
    let color = "#";

    switch (type) {
      case "random":
        const characters = "0123456789ABCDEF";
        for (let i = 0; i < 6; i++) {
          color += characters[Math.floor(Math.random() * 16)];
        }
        break;
      case "level":
        color =
          userProfile.level <= 20
            ? "#ec8545"
            : userProfile.level <= 40
            ? "#9cb3c0"
            : userProfile.level <= 60
            ? "#fed822"
            : userProfile.level <= 80
            ? "#00c8c0"
            : "#a856fa";
        break;
      default:
        color += "000000";
        break;
    }

    return color;
  };
};
