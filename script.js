const GLOBAL = {
    debug: false,
    started: undefined,
    elapsed: undefined, // ms
  };
  
  const Elements = {
    username: "//*[@id]//h2",
    followersList: "//*[@id]//div[2]/div/div/div[3]/div[1]",
    followingList: "//*[@id]//div[2]/div/div/div[4]/div[1]",
    usersDialog: "//div[@role='dialog']",
    closeUsersDialogButton: "//div[2]/div/div/div[1]/div/div[3]/div/button",
    usersNamesList: "//*[@id]//div/a/div/div/span",
    alternativeUsersNamesList: "//*[@id]/div/div/div[1]/div/a/span/div",
  };
  
  class PercentageController {
    setPercentage(value) {
      this.percentage = value;
    }
    getPercentage() {
      return this.percentage;
    }
    setLastPercentage(percentage) {
      this.lastPercentage = percentage;
    }
    percentagesAreEqual() {
      return this.percentage == this.lastPercentage ? true : false;
    }
  }
  
  class User {
    constructor() {
      this.username;
      this.followersCount, this.followingCount;
      this.followersLastCount = 0;
      this.followingLastCount = 0;
      this.totalCountedYet = 0;
      this.total;
      this.remaining;
    }
    setTotalCountedYet() {
      this.totalCountedYet = this.followersLastCount + this.followingLastCount;
      this.setRatio();
      this.setRemaining();
    }
    setTotal() {
      this.total = this.followersCount + this.followingCount;
      this.setRatio();
      this.setRemaining();
    }
    setRatio() {
      if (this.totalCountedYet && this.total)
        this.ratio = this.totalCountedYet / this.total;
    }
    setRemaining() {
      if (this.total && this.totalCountedYet)
        this.remaining = this.total - this.totalCountedYet;
    }
    getUsername() {
      debug("Searching for user's username");
      let temp;
      try {
        temp = $x(Elements.username)[0].textContent;
      } catch (getUsernameError) {
        throw new Error(getUsernameError);
      }
      if (!temp) throw new Error("Couldn't retrieve username");
      this.username = temp;
      debug(`Username: ${this.username}`);
    }
  
    getUsersCount(type) {
      debug(`Searching for user's ${type} count`);
      let temp;
      try {
        temp = $x(
          `//a[contains(@href, '/${this.username}/${type}/')]/span/span`
        )[0].textContent;
      } catch (err) {
        throw new Error(err);
      }
      if (!temp) throw new Error(`Couldn't retrieve ${type} count`);
      if (type == "followers") this.followersCount = +temp;
      if (type == "following") this.followingCount = +temp;
      debug(`User's ${type} count: ${temp}`);
    }
  }
  
  function clearConsole() {
    if (!GLOBAL.debug) console.clear();
  }
  
  function convertPercentageIntoBar(percentage) {
    if (percentage >= 0 && percentage < 10) return `▱▱▱▱▱▱▱▱▱▱ ${percentage}%`;
    if (percentage >= 10 && percentage < 20) return `▰▱▱▱▱▱▱▱▱▱ ${percentage}%`;
    if (percentage >= 20 && percentage < 30) return `▰▰▱▱▱▱▱▱▱▱ ${percentage}%`;
    if (percentage >= 30 && percentage < 40) return `▰▰▰▱▱▱▱▱▱▱ ${percentage}%`;
    if (percentage >= 40 && percentage < 50) return `▰▰▰▰▱▱▱▱▱▱ ${percentage}%`;
    if (percentage >= 50 && percentage < 60) return `▰▰▰▰▰▱▱▱▱▱ ${percentage}%`;
    if (percentage >= 60 && percentage < 70) return `▰▰▰▰▰▰▱▱▱▱ ${percentage}%`;
    if (percentage >= 70 && percentage < 80) return `▰▰▰▰▰▰▰▱▱▱ ${percentage}%`;
    if (percentage >= 80 && percentage < 90) return `▰▰▰▰▰▰▰▰▱▱ ${percentage}%`;
    if (percentage >= 90 && percentage < 100) return `▰▰▰▰▰▰▰▰▰▱ ${percentage}%`;
  }
  
  function calcPercentage(user) {
    return ((user.totalCountedYet / user.total) * 100).toFixed(2);
  }
  
  async function showInfo(user) {
    clearConsole();
    percentageController.setPercentage(calcPercentage(user));
    console.log(
      `Please wait, the process is still running...\nStatus: ${convertPercentageIntoBar(
        percentageController.getPercentage()
      )}\nEstimated time remaining: ${Math.round(
        (await getRemaining(user)) / 1000
      )} seconds`
    );
  }
  
  async function sleep(seconds) {
    let ms = seconds * 1000;
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  
  Array.prototype.diff = function (a) {
    return this.filter(function (i) {
      return a.indexOf(i) < 0;
    });
  };
  
  function getDifference(followers, following) {
    return new Promise((resolve) => {
      const difference = following.diff(followers);
      resolve(difference);
    });
  }
  
  function $x(xpathToExecute) {
    var result = [];
    var nodesSnapshot = document.evaluate(
      xpathToExecute,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    for (var i = 0; i < nodesSnapshot.snapshotLength; i++) {
      result.push(nodesSnapshot.snapshotItem(i));
    }
    return result;
  }
  
  async function getRemaining(user) {
    if (user.total && user.totalCountedYet) {
      var x = (GLOBAL.elapsed * user.total) / user.totalCountedYet;
      var rem = x - GLOBAL.elapsed;
      return rem;
    } else {
      return 999;
    }
  }
  
  class Tools {
    constructor(User) {
      this.username = User.username;
    }
    async openUsersPage(type) {
      debug(`Opening ${type} page`);
      try {
        await clickElementByXpath(
          `//a[contains(@href,'/${this.username}/${type}/')]/span/span`
        );
      } catch {
        throw new Error(`Couldn't click the ${type} page`);
      }
      let result = await waitElementByXpath(Elements.usersDialog, 1);
      if (!result) throw new Error(`Couldn't find the ${type} page`);
      debug(`${type} page opened`);
    }
    async scrollFollowers() {
      try {
        $x(Elements.followersList)[0].scrollIntoView({
          block: "end",
        });
      } catch (err) {
        throw new Error(`Scroll followers error: ${err}`);
      }
    }
    async scrollFollowing() {
      try {
        $x(Elements.followingList)[0].scrollIntoView({
          block: "end",
        });
      } catch (err) {
        throw new Error(`Scroll followers error: ${err}`);
      }
    }
    getFollowersCountBeingShown() {
      try {
        let element = $x(Elements.followersList)[0];
        if (!element) throw new Error("Couldn't find the followers list");
        let amount = element.getElementsByTagName("img").length;
        return amount;
      } catch (err) {
        throw new Error(err);
      }
    }
    getFollowingCountBeingShown() {
      try {
        let element = $x(Elements.followingList)[0];
        if (!element) throw new Error("Couldn't find the following list");
        let amount = element.getElementsByTagName("img").length;
        return amount;
      } catch (err) {
        throw new Error(err);
      }
    }
    async closeUsersPage(type) {
      debug(`Closing ${type} page`);
      try {
        let element = $x(Elements.closeUsersDialogButton)[0];
        if (!element)
          throw new Error(`Couldn't find the close ${type} page button`);
        clickElementByXpath(Elements.closeUsersDialogButton);
        debug(`${type} page closed`);
      } catch (err) {
        throw new Error(err);
      }
    }
  }
  
  function clickElementByXpath(path, index = 0) {
    return new Promise((resolve, reject) => {
      try {
        let element = $x(path)[index];
        if (!element) throw new Error("Couldn't find the element");
        element.scrollIntoView({ block: "center" });
        element.click();
        resolve(element);
      } catch (err) {
        reject(err);
      }
    });
  }
  
  function getUsersNames(type) {
    debug("Searching for users usernames");
    let users = [];
    let usersNamesList = $x(Elements.usersNamesList);
    for (const user of usersNamesList) {
      users.push(user.innerText);
    }
    if (users.length == 0) {
      usersNamesList = $x(Elements.alternativeUsersNamesList);
      for (const user of usersNamesList) {
        users.push(user.innerText);
      }
      if (users.length == 0) {
        throw new Error(`Couldn't retrieve ${type} usernames`);
      }
    }
    return users;
  }
  
  async function waitElementByXpath(path, index = 0, timeout = 10) {
    let timer = 0;
    let element;
    while (timer <= timeout) {
      element = $x(path)[index];
      if (element) break;
      await sleep(0.1);
      timer += 0.1;
    }
    return element;
  }
  
  function debug(message, style = "", bool_debug = GLOBAL.debug) {
    if (bool_debug) {
      style ? console.log(`%c${message}`, style) : console.log(message);
    }
  }
  
  try {
    var user = new User();
    user.getUsername();
    user.getUsersCount("followers");
    user.getUsersCount("following");
    user.setTotal();
    console.log(`Total: ${user.total}`);
    var tools = new Tools(user);
    await tools.openUsersPage("followers");
  
    GLOBAL.started = Date.now();
    var percentageController = new PercentageController();
  
    while (tools.getFollowersCountBeingShown() < user.followersCount) {
      user.followersLastCount = tools.getFollowersCountBeingShown();
      user.setTotalCountedYet();
      GLOBAL.elapsed = Date.now() - GLOBAL.started;
      await showInfo(user);
      await tools.scrollFollowers();
      await sleep(0.1);
    }
    GLOBAL.followers = getUsersNames("followers");
    debug(GLOBAL.followers);
    await tools.closeUsersPage("followers");
    await tools.openUsersPage("following");
  
    var followingPercentageRepeatCount = 0;
  
    while (
      tools.getFollowingCountBeingShown() < user.followingCount &&
      followingPercentageRepeatCount <= 10
    ) {
      user.followingLastCount = tools.getFollowingCountBeingShown();
      user.setTotalCountedYet();
      GLOBAL.elapsed = Date.now() - GLOBAL.started;
      await showInfo(user);
      if (percentageController.percentagesAreEqual()) {
        followingPercentageRepeatCount++;
        if (followingPercentageRepeatCount >= 3) {
          console.log(`Looks like the process is not responding. Please wait...`);
        }
        await sleep(1);
      } else {
        followingPercentageRepeatCount = 0;
      }
      await tools.scrollFollowing();
      await sleep(0.25);
      percentageController.setLastPercentage(calcPercentage(user));
    }
    clearConsole();
    GLOBAL.following = getUsersNames("following");
    debug(GLOBAL.following);
    await tools.closeUsersPage("following");
    GLOBAL.difference = await getDifference(GLOBAL.followers, GLOBAL.following);
    console.log(
      `Amount of people that don't follow you back: ${GLOBAL.difference.length}`
    );
    if (GLOBAL.difference.length) {
      console.log(GLOBAL.difference);
      console.log(
        "%cPS: if you want to unfollow any of the people in the list, you have to do it MANUALLY.",
        "color: red"
      );
    }
  } catch (err) {
    alert(err.message);
    console.error(err);
  } finally {
    console.log("%cEND", "color: red; font-size: 2em;");
    console.log(`Made with ♥ by PZL`);
  }
  