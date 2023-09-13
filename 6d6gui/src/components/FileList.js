// Showcase for the deviceList.
const FileList = ({ dirList, changeFile, fileChoice, switchContent }) => {
  return (
    <div>
      {dirList.length !== 0 && (
        <div className="list-style">
          {dirList.map((obj, key) =>
            <div style={{ marginTop: '0.5em' }} key={key}>
              <label style={{ marginLeft: '0.25em' }} >
                <input
                  style={{ float: 'Left' }}
                  type='radio'
                  onChange={() => {
                    switchContent(2)
                    changeFile(obj.name)
                  }}
                  checked={obj.name === fileChoice}
                  value={obj}
                  name='file'
                  key={obj.id}
                />
                {obj.name}
              </label>
            </div>
          )}
        </div>
      )}
      {dirList.length === 0 && (
        <div className="list-style">Please connect a 6d6<br />device to copy from.</div>
      )}
    </div>
  )
}

export default FileList
