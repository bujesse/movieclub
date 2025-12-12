'use client'

import { useState } from 'react'

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: {
    name: string
    description: string
    letterboxdUrl: string
    isGlobal: boolean
  }) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [letterboxdUrl, setLetterboxdUrl] = useState('')
  const [isGlobal, setIsGlobal] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const isValid = name.trim() !== '' && letterboxdUrl.trim() !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setShowErrors(true)
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      letterboxdUrl: letterboxdUrl.trim(),
      isGlobal,
    })
    handleModalClose()
  }

  const handleModalClose = () => {
    setName('')
    setDescription('')
    setLetterboxdUrl('')
    setIsGlobal(false)
    setShowErrors(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={handleModalClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Create New Collection</p>
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

            <div className="field">
              <label className="label" htmlFor="letterboxdUrl">
                Letterboxd URL Path
              </label>
              <div className="control">
                <input
                  id="letterboxdUrl"
                  className={`input ${showErrors && !letterboxdUrl.trim() ? 'is-danger' : ''}`}
                  placeholder="e.g., dave/list/top-100-american-movies"
                  type="text"
                  value={letterboxdUrl}
                  onChange={(e) => setLetterboxdUrl(e.target.value)}
                  required
                />
              </div>
              <p className="help">
                Enter the Letterboxd list path (the part after letterboxd.com/)
              </p>
              {showErrors && !letterboxdUrl.trim() && (
                <p className="help is-danger">Letterboxd URL path is required</p>
              )}
            </div>

            <div className="field">
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={isGlobal}
                    onChange={(e) => setIsGlobal(e.target.checked)}
                  />
                  <span className="ml-2">Global Collection (visible to all users)</span>
                </label>
              </div>
            </div>
          </form>
        </section>
        <footer className="modal-card-foot">
          <button className="button is-success" onClick={handleSubmit} disabled={!isValid}>
            Create Collection
          </button>
          <button className="button" onClick={handleModalClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}
