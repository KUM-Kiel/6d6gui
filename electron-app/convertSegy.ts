import { Pauser } from "./Pauser"


const convertSegy = async (pauser: Pauser, onUpdate: (percentage: number) => void, d6file /*...*/) => {
  while (true) {
    await pauser.whilePaused()
    if (!d6file.read({
      // ...
    })) return
  }
  // ...
}
