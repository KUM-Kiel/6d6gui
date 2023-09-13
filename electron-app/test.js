const { default: Kum6D6 } = require("./Kum6D6")

const main = async () => {
  const file = await Kum6D6.open(process.argv[2])

  console.log(file.header)

  while (await file.read({
    onTimeStamp: (s, us) => {
      console.log([s, us])
    }
  })) {}
}
main().catch(e => {
  console.error(e)
  process.exit(1)
})
