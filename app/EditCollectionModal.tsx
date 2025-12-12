'use client'

import { useState, useEffect } from 'react'

export default function EditCollectionModal({
  isOpen,
  onClose,
  onSubmit,
  initialName,
  initialDescription,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: { name: string; description: string }) => void
  initialName: string
  initialDescription: string
}) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [showErrors, setShowErrors] = useState(false)

  // Update state when initial values change
  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setDescription(initialDescription)
      setShowErrors(false)
    }
  }, [isOpen, initialName, initialDescription])

  const isValid = name.trim() !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setShowErrors(true)
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
    })
    handleModalClose()
  }

  const handleModalClose = () => {
    setShowErrors(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={handleModalClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Edit Collection</p>
          <button className="delete" aria-label="close" onClick={handleModalClose}></button>
        </header>
        <section className="modal-card-body">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="collectionName">
                Collection Name
              </label>
              <div className="control">
                <input
                  id="collectionName"
                  className={`input ${showErrors && !name.trim() ? 'is-danger' : ''}`}
                  placeholder="e.g., IMDB Top 250"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {showErrors && !name.trim() && (
                <p className="help is-danger">Collection name is required</p>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="collectionDescription">
                Description
              </label>
              <div className="control">
                <textarea
                  id="collectionDescription"
                  className="textarea"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </form>
        </section>
        <footer className="modal-card-foot">
          <button className="button is-success" onClick={handleSubmit} disabled={!isValid}>
            Save Changes
          </button>
          <button className="button" onClick={handleModalClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}
