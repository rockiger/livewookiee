(ns akiee.fileoperations
  (:require [cljs.test :refer-macros [is deftest]]
            [cljs.nodejs :as nj]))

;; Node modules
(def fs (js/require "fs"))
(def path (nj/require "path"))
(def process (nj/require "process"))
(def org (nj/require "./lib/markdown-org-mode-parser"))

(enable-console-print!)

;; All file operations for Akiee

;; =================
;; Constants:

(def dirname ".akiee")
(def filename "liveflow.md")
(def testfile "/home/macco/Listings/rakiee/test-load-file.md")

;; =================
;; Functions:

(defn user-home
  "nil -> String
  produce the home directory of the user according to plattform"
  []
  (.join
    path
    (if (= (.-platform process) "win32")
      (aget (.-env process) "USERPROFILE")
      (aget (.-env process) "HOME"))
    dirname "/"))

(is (string? (user-home)))
(is (not= -1 (.indexOf (user-home) dirname)))


(defn create-task-list-file
  "String -> String
  consumes the directory of the task file and return the file path of task list,
  if file is not present, it get's created"
  [h]
  (let [dir-path (.join path h "/")
        file-path (.join path dir-path filename)]
    (if (.existsSync fs dir-path)
      (if (.existsSync fs file-path)
        file-path
        (do
          (.writeFileSync fs file-path "# Inbox")
          file-path))
      (do
        (.mkdirSync fs dir-path)
        (.writeFileSync fs file-path "# Inbox")
        file-path))))

(is (= (create-task-list-file "/home/macco") (str "/home/macco/" filename)))


(defn task-file-path
  "String -> String
  Consumes a directory path d and produce the path of the task file"
  [d]
  (create-task-list-file d))

;(is (string? (task-file-path "Test")))

(defn load-task-file
  "String -> String
  consumes the path p for a file and returns the content of the file"
  [p]
  (if (.existsSync fs p)
    (str (.readFileSync fs p "utf8"))
    ""))
(is (= (load-task-file "") ""))
(is (= (load-task-file "eurniate") ""))
;(is (= (load-task-file testfile) "# Inbox\n## TODO Test\nRANK: 9\n"))

(defn save-task-file [c p changed? chfn!]
  "String String ListOfNode -> Nil
  Consume the content c, the path of the target-file p; returns nil"
  (if changed?
    (do
      (.writeFileSync fs p c)
      (chfn! false))
    (println "not changed")))
