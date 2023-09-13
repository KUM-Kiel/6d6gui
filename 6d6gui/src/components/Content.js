import Copy from './Copy'
import MSeed from './MSeed'
import Read from './Read'
import Segy from './Segy'

// Conainer for the main content of a chosen MenuItem.
const Content = ({
  contentId,
  choosePath,
  destPath,
  srcFile,
  fileChoice,
  setFilename,
  filename,
  trSubmitCom,
  channelNr,
  deviceInfo,
  setHighlightTime
}) => {
  let contentShown = null

  // Passing the function call to App.js.
  const startProcessing = data => {
    trSubmitCom(data)
  }

  // Change the content depending on the chosen MenuItem.
  if (contentId === 1) {
    contentShown = (
      <Read
        choosePath={choosePath}
        filename={filename}
        setFilename={setFilename}
        destPath={destPath}
        srcFile={srcFile}
        startProcessing={startProcessing}
      />
    )
  } else if (contentId === 0) {
    contentShown = (
      <MSeed
        deviceInfo={deviceInfo}
        choosePath={choosePath}
        channelNr={channelNr}
        destPath={destPath}
        srcFile={srcFile}
        startProcessing={startProcessing}
        setHighlightTime={setHighlightTime}
      />
    )
  } else if (contentId === 2) {
    contentShown = (
      <Segy
        fickSchnitzel={deviceInfo} />
    )
  } else {
    contentShown = (
      <Copy
        fileChoice={fileChoice}
        choosePath={choosePath}
        filename={filename}
        setFilename={setFilename}
        destPath={destPath}
        startProcessing={startProcessing}
      />
    )
  }
  return <div className='content-main'>{contentShown}</div>
}

export default Content
