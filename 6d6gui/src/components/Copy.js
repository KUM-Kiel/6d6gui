// Main Content for the use of 6D6Copy.
import TextInput from './TextInput'
import Startbutton from './StartButton'

// The view for the use of 6d6Copy.
export const Copy = ({
  fileChoice,
  choosePath,
  filename,
  destPath,
  setFilename,
  startProcessing,
}) => {
  return (
    <div className="copy-main">
      <p>
        This utility copies the content of a 6D6 formatted storage to a
        choosable destination directory.
      </p>
      {fileChoice !== null && (
        <p>
          <button
            className="btn medium"
            onClick={() => {
              choosePath(false, 'target')
            }}
          >
            Choose Directory
          </button>
        </p>
      )}
      <div className={`${destPath === '' ? 'hidden' : 'shown'}`}>
        <p>
          Set up to copy from{' '}
          <span className="copy-text-hightlight">{fileChoice}</span> to
        </p><div className="row">
          {destPath !== '' && (
            <TextInput
              value={filename.value}
              valid={filename.valid}
              changeFunction={setFilename}
              placeholder={'Filename'}
            />
          )}
          <p>.6d6</p></div>
        <p>
          in <span className="copy-text-hightlight">{destPath}/</span>
        </p>
      </div>
      <Startbutton
        filename={filename}
        destPath={destPath}
        type={'copy'}
        startProcessing={startProcessing}
      />
    </div>
  )
}

export default Copy
