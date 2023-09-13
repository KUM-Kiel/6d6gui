// Button to start a process/command.
const StartButton = ({
  startProcessing,
  type,
  filename,
  destPath,
  srcFile
}) => {
  let condition
  if (type === 'copy') {
    condition = destPath
  } else if (type === 'read') {
    condition = srcFile.path
  }
  return (
    <div>
      {condition !== '' &&
        ((filename.valid && (
          <button
            className='btn medium'
            onClick={() => {
              startProcessing({ type: type })
            }}
          >
            Start {type}
          </button>
        )) ||
          (!filename.valid &&
            ((filename.value === '' && <p>You need to enter a filename</p>) ||
              (filename.value !== '' && (
                <p style={{ color: 'var(--warning)' }}>
                  Invalid characters used.
                </p>
              )))))}
    </div>
  )
}
export default StartButton
