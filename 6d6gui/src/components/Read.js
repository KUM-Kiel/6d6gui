// Main Content for the use of 6D6Read.
import TextInput from './TextInput'
import Startbutton from './StartButton'

export const Read = ({
  srcFile,
  choosePath,
  startProcessing,
  filename,
  destPath,
  setFilename
}) => {

  return (
    <div className="read-main">
      <p>This utility converts a 6D6 formatted file to a .s2x file.</p>
      <p>
        <button
          className="btn medium"
          onClick={() => {
            choosePath(true)
          }}
        >
          Choose File
        </button>
        {srcFile.path !== '' && (
        <button
          className='btn medium'
          onClick={() => {
            choosePath(false, 'target')
          }}
        >
          Choose Output Location
        </button>
        )}
      </p>
      {srcFile.path === '' && <p>Please choose a .6d6 file to convert from.</p>}
      <div className={`${srcFile.path === '' ? 'hidden' : 'shown'}`}>
        <br />
        Set up to convert from
        <span className="read-text-hightlight"> {srcFile.filename} </span> to
        <div className="row">
          {srcFile.path !== '' && (
            <TextInput
              value={filename.value}
              valid={filename.valid}
              changeFunction={setFilename}
              placeholder={'Filename'}
            />
          )}
          <p>.s2x</p></div>
        <p>
          in <span className="read-text-hightlight">{destPath}</span>
        </p>
      </div>
      <br />
      <Startbutton
        filename={filename}
        type={'read'}
        srcFile={srcFile}
        destPath={destPath}
        startProcessing={startProcessing}
      />
    </div>
  )
}

export default Read
